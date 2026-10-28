import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const out=resolve(process.env.ZA_TEST_OUTPUT || 'test-results');await mkdir(out,{recursive:true})
const browser=await chromium.launch({executablePath:process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']})
const errors=[],results=[]
try {
 const context=await browser.newContext({viewport:{width:1000,height:700}})
 await context.addInitScript(()=>Object.defineProperty(navigator,'xr',{value:undefined,configurable:true}))
 const p=await context.newPage(); p.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.stack)})
 p.on('console',m=>{if(m.type()==='error' && !m.text().includes('No runtimes supported'))errors.push(m.text())})
 await p.goto('http://127.0.0.1:5190/?devWorld=http%3A%2F%2Flocalhost%3A5182%2F')
 await p.waitForFunction(()=>window.__ttvXrStore?.getState().emulator && [...(window.__ttvEngine?.interactables.values()||[])].some(i=>i.spec().label==='▶ 全員で最初から再生'&&i.spec().enabled),{}, {timeout:90000})
 await p.evaluate(async()=>{if(!window.__ttvXrStore.getState().session)await window.__ttvXrStore.enterVR()})
 await p.waitForFunction(()=>window.__ttvEngine.player.vr,{}, {timeout:15000})
 await p.evaluate(()=>{
   const input=window.__ttvXrStore.getState().emulator.devui.inputLayer
   input.playerRig.rotation.set(0,0,0); input.cameraRig.rotation.set(0,0,0)
   const device=window.__ttvXrStore.getState().emulator
   device.ipd=0.064;device.stereoEnabled=true
   const e=window.__ttvEngine
   e.runtime.state.set('w:za-nas:playback:v1',{playing:true,startAt:e.runtime.clock().now(),offset:35,revision:100})
   let root=[...e.interactables.values()][0].obj;while(root.parent)root=root.parent
   window.__eyeSamples=[]
   root.onBeforeRender=(renderer,scene,camera)=>{
     const list=window.__eyeSamples
     const eyes=renderer.xr.getCamera().cameras
     list.push({p:camera.matrixWorld.elements.slice(12,15),xr:renderer.xr.enabled,offscreen:!!renderer.getRenderTarget(),expected:eyes.length===2?new window.__TTV__.three.Vector3().setFromMatrixPosition(eyes[0].matrixWorld).distanceTo(new window.__TTV__.three.Vector3().setFromMatrixPosition(eyes[1].matrixWorld)):0})
     if(list.length>4)list.shift()
   }
 })
 await p.waitForTimeout(2000)
 const snap=()=>p.evaluate(()=>{
   const e=window.__ttvEngine,T=window.__TTV__.three
   let root=[...e.interactables.values()][0].obj;while(root.parent)root=root.parent
   const deck=root.getObjectByName('ZA_NAS_DECK')
   const headYaw=new T.Euler().setFromQuaternion(e.player.head.q,'YXZ').y
   return {vr:e.player.vr,yaw:Math.atan2(Math.sin(headYaw-deck.rotation.y),Math.cos(headYaw-deck.rotation.y)),local:e.player.position.clone().sub(deck.position).applyAxisAngle(new T.Vector3(0,1,0),-deck.rotation.y).toArray(),hands:!!e.player.left&&!!e.player.right}
 })
 const before=await snap()
 const stereo=await p.evaluate(()=>window.__eyeSamples)
 assert.equal(stereo.length,4)
 assert.ok(stereo.every(s=>!s.xr&&s.offscreen),'each eye renders into the postprocessing target')
 const eyeSeparation=Math.hypot(...stereo[2].p.map((v,i)=>v-stereo[3].p[i]))
 console.log('STEREO',JSON.stringify(stereo))
 assert.ok(eyeSeparation>0.05 && Math.abs(eyeSeparation-stereo[3].expected)<0.001,`stereo eye separation: ${eyeSeparation}`)
 console.log('PASS postprocessing retains tracked stereo eye separation',eyeSeparation)
 await p.evaluate(()=>{window.__ttvXrStore.getState().emulator.devui.inputLayer.playerRig.rotation.y=0.6})
 await p.waitForTimeout(800)
 const turned=await snap();await p.waitForTimeout(800);const held=await snap()
 const turn=Math.atan2(Math.sin(turned.yaw-before.yaw),Math.cos(turned.yaw-before.yaw))
 console.log('VR head turn',JSON.stringify({before,turned,held,turn}))
 assert.ok(Math.abs(turn-0.6)<0.06,'physical head turn must remain free while riding')
 assert.ok(Math.abs(held.yaw-turned.yaw)<0.06,'head direction must not drift back')
 assert.ok(Math.hypot(held.local[0]-before.local[0],held.local[2]-before.local[2])<0.08,'moving rail must preserve the passenger offset without physical walking')
 await p.evaluate(()=>{window.__ttvXrStore.getState().emulator.devui.inputLayer.combinedCameraPosition.x+=0.7})
 await p.waitForTimeout(700)
 const walked=await snap()
 assert.ok(Math.hypot(walked.local[0]-held.local[0],walked.local[2]-held.local[2])>0.25,'physical walking must move on the deck')
 assert.ok(walked.vr && walked.hands && Math.abs(walked.local[1])<0.3)
 await p.evaluate(()=>{const e=window.__ttvEngine;e.runtime.state.set('w:za-nas:playback:v1',{playing:true,startAt:e.runtime.clock().now(),offset:60,revision:101})})
 await p.waitForTimeout(700)
 const cut=await snap()
 assert.ok(Math.abs(Math.atan2(Math.sin(cut.yaw-held.yaw),Math.cos(cut.yaw-held.yaw)))<0.06,'camera cut must preserve voluntary head rotation')
 assert.ok(Math.abs(cut.local[1])<0.3)
 await p.screenshot({path:resolve(out,'vr-effects.png')})
 results.push({name:'Quest 3 emulator: stereo effects, free head look, no yaw drift, room-scale walking, hands, floor and camera cut',passed:true,eyeSeparation,before,turned,held,walked,cut})
 await p.evaluate(()=>{const e=window.__ttvEngine;e.runtime.state.set('w:za-nas:playback:v1',{playing:false,startAt:0,offset:0,revision:102})})
 await p.waitForTimeout(700)
 const stopped=await p.evaluate(()=>({p:window.__ttvEngine.player.position.toArray(),samples:window.__eyeSamples}))
 console.log('VR stopped',JSON.stringify(stopped))
 assert.ok(Math.hypot(stopped.p[0],stopped.p[2]-8)<0.1,'stopping returns the VR passenger to the entrance')
 // TenTenV's avatar mirror still makes occasional non-XR offscreen renders while idle.
 assert.ok(stopped.samples.some(s=>s.xr),'stopping restores the normal XR renderer')
 results.push({name:'VR stop restores normal stereo rendering and entrance',passed:true,position:stopped.p})
 assert.deepEqual(errors,[])
 console.log('PASS VR head tracking and physical walking on the deck')
}finally{await writeFile(resolve(out,'vr-results.json'),JSON.stringify({results,errors},null,2));await browser.close()}
