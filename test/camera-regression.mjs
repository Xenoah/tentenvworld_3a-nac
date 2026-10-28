// Compare the extracted choreography with the supplied, unmodified film at every shot midpoint.
import { chromium } from 'playwright-core'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const input = process.argv[2]
if (!input) throw Error('Pass the original ZA_NAS_Film.html path')
const out=resolve(process.env.ZA_TEST_OUTPUT || 'test-results'); await mkdir(out,{recursive:true})
let original=await readFile(input,'utf8')
const replacement='window.__FILM={camera:Ye,scene:lt,shots:Xa,uniforms:cd.uniforms,bloom:_u,streak:h0,bursts:gS,inverts:xS,shocks:hd,frame:AS'
assert.ok(original.includes('window.__FILM={frame:AS'))
original=original.replace('window.__FILM={frame:AS',replacement)
// The normal HTML transport is not needed while sampling explicit frames.
original=original.replace(/<script>\s*\(\(\) => \{[\s\S]*?<\/script>/,'')
const browser=await chromium.launch({executablePath:process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader']})
try {
 const context=await browser.newContext({viewport:{width:960,height:600}})
 const reference=await context.newPage()
 await reference.route('**/reference',route=>route.fulfill({contentType:'text/html',body:original}))
 await reference.goto('http://127.0.0.1:5190/reference')
 await reference.waitForFunction(()=>window.READY,{}, {timeout:90000})
 const expected=await reference.evaluate(()=>{
   const f=window.__FILM
   const samples=[...f.shots.map(s=>(s.t0+s.t1)/2),...f.inverts.map(t=>t+.04),...f.shocks.map(s=>s.t+.13)]
   return samples.map(t=>{
     f.frame(t);const c=f.camera,post=Object.fromEntries(Object.entries(f.uniforms).filter(([k])=>k!=='tDiffuse').map(([k,u])=>[k,u.value?.toArray?u.value.toArray():u.value]))
     return {t,p:c.position.toArray(),q:c.quaternion.toArray(),fov:c.fov,post,bloom:[f.bloom.strength,f.bloom.radius,f.bloom.threshold,f.streak.strength]}
   })
 })
 console.log('Original sampled: 39 shots plus effect events,',expected.length,'samples')
 const converted=await context.newPage()
 converted.on('pageerror',e=>console.error('CONVERTED',e.message))
 converted.on('console',m=>{if(m.type()==='error')console.error(m.text())})
 converted.on('requestfailed',r=>console.error('REQUEST',r.url(),r.failure()))
 const moduleUrl='/@fs/'+resolve('worlds/za-nas/src/film.js').replaceAll('\\','/')
 const assetBase='/@fs/'+resolve('worlds/za-nas/public').replaceAll('\\','/')+'/'
 await converted.route('**/converted',route=>route.fulfill({contentType:'text/html',body:`<script type="module">import {createFilm} from '${moduleUrl}'; import * as THREE from '/node_modules/.vite/deps/three.js'; const renderer=new THREE.WebGLRenderer(); window.film=await createFilm({renderer,assetUrl:p=>'${assetBase}'+p});</script>`}))
 await converted.goto('http://127.0.0.1:5190/converted')
 await converted.waitForFunction(()=>window.film,{}, {timeout:90000})
 const actual=await converted.evaluate(times=>times.map(t=>{
   const f=window.film;f.update(t);const c=f.camera
   const post=Object.fromEntries(Object.entries(f.post.uniforms).filter(([k])=>k!=='tDiffuse').map(([k,u])=>[k,u.value?.toArray?u.value.toArray():u.value]))
   return {t,p:c.position.toArray(),q:c.quaternion.toArray(),fov:c.fov,post,bloom:[f.post.bloom,f.post.radius,f.post.threshold,f.post.streak]}
 }),expected.map(x=>x.t))
 let maxError=0
 for(let i=0;i<expected.length;i++)for(const k of ['p','q'])for(let j=0;j<expected[i][k].length;j++)maxError=Math.max(maxError,Math.abs(expected[i][k][j]-actual[i][k][j]))
 assert.ok(maxError<1e-8,`Camera mismatch ${maxError}`)
 let maximumEffectError=0
 for(let i=0;i<expected.length;i++) {
   for(const k of Object.keys(expected[i].post)) {
     const a=[expected[i].post[k]].flat(),b=[actual[i].post[k]].flat()
     for(let j=0;j<a.length;j++)maximumEffectError=Math.max(maximumEffectError,Math.abs(a[j]-b[j]))
   }
   for(let j=0;j<4;j++)maximumEffectError=Math.max(maximumEffectError,Math.abs(expected[i].bloom[j]-actual[i].bloom[j]))
 }
 assert.ok(maximumEffectError<1e-7,`Effect timing/strength mismatch ${maximumEffectError}`)
 const originalWindows=await reference.evaluate(()=>{let material;window.__FILM.scene.traverse(o=>{if(o.material?.fragmentShader?.includes('float win = step'))material=o.material});return {vertexShader:material.vertexShader,fragmentShader:material.fragmentShader}})
 const windowStability=await converted.evaluate(async original=>{
   const T=await import('/node_modules/.vite/deps/three.js'),film=window.film
   film.update(12)
   let material;film.scene.traverse(o=>{if(o.material?.fragmentShader?.includes('windowHash'))material=o.material})
   const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(320,240)
   const geo=new T.BoxGeometry(1,1,1);geo.setAttribute('aSeed',new T.InstancedBufferAttribute(new Float32Array([.527319]),1))
   const mesh=new T.InstancedMesh(geo,material,1);mesh.setMatrixAt(0,new T.Matrix4().makeScale(40,60,5));mesh.frustumCulled=false
   const scene=new T.Scene();scene.add(mesh)
   const camera=new T.PerspectiveCamera(45,4/3,.1,1000)
   const old=new T.ShaderMaterial({...original,uniforms:material.uniforms})
   const gl=renderer.getContext(),pixels=new Uint8Array(320*240*4)
   function jitter(m,distance) {
     mesh.material=m;const frames=[]
     for(let i=0;i<12;i++) {camera.position.set(i*0.07,0,distance);camera.lookAt(camera.position.x,0,0);renderer.render(scene,camera);gl.readPixels(0,0,320,240,gl.RGBA,gl.UNSIGNED_BYTE,pixels);frames.push(pixels.slice())}
     let error=0,count=0
     for(let n=1;n<frames.length;n++)for(let i=0;i<pixels.length;i+=4){error+=(frames[n][i]-frames[n-1][i])**2+(frames[n][i+1]-frames[n-1][i+1])**2+(frames[n][i+2]-frames[n-1][i+2])**2;count+=3}
     return error/count
   }
   const samples=[70,200,500].map(distance=>({distance,before:jitter(old,distance),after:jitter(material,distance)}))
   old.dispose();geo.dispose();renderer.dispose()
   return samples
 },originalWindows)
 const before=windowStability.reduce((s,x)=>s+x.before,0),after=windowStability.reduce((s,x)=>s+x.after,0)
 assert.ok(after<before*.5,`Window shimmer must be substantially reduced: ${JSON.stringify(windowStability)}`)
 const result={shots:39,effectSamples:expected.length,maximumCameraError:maxError,maximumEffectError,windowStability,samples:actual}
 await writeFile(resolve(out,'camera-results.json'),JSON.stringify(result,null,2))
 console.log('PASS all original camera position/orientation samples match:',maxError)
 console.log('PASS original screen effects match:',maximumEffectError,'; window shimmer:',JSON.stringify(windowStability))
} finally {await browser.close()}
