from pathlib import Path
import re, json, base64, hashlib, shutil, sys, subprocess

if len(sys.argv) != 2:
    raise SystemExit('Usage: python tools/convert.py path/to/ZA_NAS_Film.html (MP3 in the same folder)')
src=Path(sys.argv[1]).resolve()
out=Path(__file__).resolve().parent.parent
(out/'src').mkdir(parents=True, exist_ok=True)
(out/'public').mkdir(exist_ok=True)
html=src.read_text(encoding='utf-8')
assets=json.loads(re.search(r'window.__ASSETS = (.*?);</script>',html,re.S)[1])
for name,value in assets.items():
    if name in ('audio','timeline'): continue
    p=out/'public'/name
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_bytes(base64.b64decode(value))
(out/'src/timeline.json').write_text(json.dumps(assets['timeline'],separators=(',',':')),encoding='utf-8')
audio=src.with_name('ZA_NAS_Dubstep_Remix_hires.mp3')
shutil.copyfile(audio,out/'public/music.mp3')
print('Embedded audio equals supplied MP3:',base64.b64decode(assets['audio'])==audio.read_bytes())
module=re.search(r'<script type="module">([\s\S]*?)</script>',html)[1]
s=subprocess.run(['node', '-e', "const fs=require('node:fs'); const esbuild=require('esbuild'); process.stdout.write(esbuild.transformSync(fs.readFileSync(0,'utf8'),{minify:false}).code)"], input=module, text=True, encoding='utf-8', capture_output=True, check=True, cwd=out).stdout
body=s[s.index('function iS('):s.index('var gu =')]
body=body.replace('var ed = {};\nX0(ed, '+s.split('var ed = {};\nX0(ed, ',1)[1].split('\n',1)[0], '')
body=re.sub(r'var sS = new Qs\(\), rS = .*?\}\)\), Fa = null;', 'var rS = async (path) => { const tex = await new Qs().loadAsync(assetUrl(path)); tex.flipY = false; return tex; }, Fa = null;',body,flags=re.S)
body=body.replace('new URLSearchParams(location.search)','new URLSearchParams()')
# MSAA can interpolate outside [0,1] at a cone silhouette. A negative UV raised
# to 1.5 produces NaN, which the bloom blur spreads across the whole frame.
assert body.count('pow(vY,1.5)') == 1
body=body.replace('pow(vY,1.5)', 'pow(clamp(vY,0.,1.),1.5)')
# Instance seeds must not acquire interpolation rounding noise inside a sine hash.
# Derivative filtering also prevents subpixel windows from flashing as the viewer moves.
city_start=body.index('function Xf(')
city_end=body.index('function Zm(',city_start)
city=body[city_start:city_end].replace('varying float vSeed;', 'flat varying float vSeed;')
city=city.replace('      void main(){\n        vec3 n = normalize(vN);', '''
      float windowHash(vec2 cell, float salt) {
        uvec2 p = uvec2(ivec2(cell));
        uint h = p.x * 1597334677u ^ p.y * 3812015801u ^ uint(vSeed * 65535. + .5) ^ uint(salt);
        h ^= h >> 16; h *= 2246822519u; h ^= h >> 13; h *= 3266489917u; h ^= h >> 16;
        return float(h >> 8) / 16777216.;
      }
      void main(){
        vec3 n = normalize(vN);''')
old='''vec2 cs = vec2(2.6, 3.4); vec2 cell = floor(uv/cs); vec2 f = fract(uv/cs);'''
assert old in city
city=city.replace(old, '''vec2 cs = vec2(2.6,3.4); vec2 grid = uv/cs; vec2 cell = floor(grid); vec2 f = fract(grid);
        vec2 fw = max(fwidth(grid), vec2(0.0001));
        float distant = smoothstep(0.35, 1.5, max(fw.x, fw.y));''')
city=city.replace('step(0.16,f.x)*step(f.x,0.84)*step(0.2,f.y)*step(f.y,0.8)', '(smoothstep(0.16-fw.x,0.16+fw.x,f.x)*(1.-smoothstep(0.84-fw.x,0.84+fw.x,f.x)) * smoothstep(0.2-fw.y,0.2+fw.y,f.y)*(1.-smoothstep(0.8-fw.y,0.8+fw.y,f.y)))')
city=city.replace('h21(cell + vSeed*37.)','windowHash(cell, 0.)').replace('h21(cell*1.7+vSeed)','windowHash(cell, 13.)').replace('h21(cell*2.3+vSeed)','windowHash(cell, 29.)').replace('h21(cell+3.1)','windowHash(cell, 47.)')
city=city.replace('        vec3 col = vec3(0.012,0.014,0.02) + win*(lit*wc*(0.35+0.75*windowHash(cell, 47.)) + (1.-lit)*vec3(0.015,0.018,0.026));', '''
        vec3 meanWindow = mix(mix(vec3(1.,0.66,0.38),vec3(0.4,0.75,1.2),0.2),vec3(1.3,0.25,0.45),0.05);
        vec3 windowLight = lit*wc*(0.35+0.75*windowHash(cell, 47.))+(1.-lit)*vec3(0.015,0.018,0.026);
        windowLight = mix(windowLight,0.26*uWinOn*meanWindow*0.725+(1.-0.26*uWinOn)*vec3(0.015,0.018,0.026),distant);
        win = mix(win,0.408*(1.-isTop)*smoothstep(2.3,2.7,vW.y),distant);
        lit = mix(lit,0.26*uWinOn,distant);
        vec3 col = vec3(0.012,0.014,0.02) + win*windowLight;''')
body=body[:city_start]+city+body[city_end:]
# Preserve the original screen shaders, rather than approximating their choreography.
post=s[s.index('var gu ='):s.index('var { G: Pt, mulberry: Za }')]
post=post.replace('var gu = class', 'export const StreakPass = class').replace('}, n0 = {', '};\nexport const filmShader = {')
post=post.replace('  render(e, t, n) {', '''  setSize(w, h) {
    this.rtA.setSize(Math.max(1, Math.round(w/4)), Math.max(1, Math.round(h/4)));
    this.rtB.setSize(Math.max(1, Math.round(w/4)), Math.max(1, Math.round(h/4)));
    this.copyRT.setSize(w,h); this.blur.material.uniforms.uTexel.value = 1/this.rtA.width;
  }
  dispose() {
    for(const target of [this.rtA,this.rtB,this.copyRT]) target.dispose();
    for(const quad of [this.th,this.blur,this.comp,this.copyBack]) if(quad) { quad.material.dispose(); quad.dispose(); }
  }
  render(e, t, n) {''')
(out/'src/film-post.js').write_text('''// Generated from the supplied HTML by tools/convert.py.
import { HalfFloatType as Xt, WebGLRenderTarget as Ct, ShaderMaterial as We, Color as re, Vector2 as xe, Vector4 as et } from 'three';
import { Pass as Ln, FullScreenQuad as jn } from 'three/examples/jsm/postprocessing/Pass.js';
'''+post,encoding='utf-8')
init='''
const Pt = wt, Za = Vn, id = new URLSearchParams();
const Tn = 240 / 138, cS = Tn / 4, uS = 0.024, i0 = 1 / 24, X = t => uS + t * Tn;
const lt = new Zr(); lt.name = 'ZA_NAS_FILM'; lt.fog = new Zo(0, 0.004);
const Ye = new Kt(45, 1280 / 536, 0.03, 6000);
const envTargets = [];
const hS = new po(renderer);
'''
init+=s[s.index('function p0('):s.index('var yu = window.__ASSETS.timeline')].replace('hS.fromScene(e, 0.03).texture','(() => { const target = hS.fromScene(e, 0.03); envTargets.push(target); e.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); return target.texture; })()')
init+='\nhS.dispose();\n'
init+='''
const post = { uniforms: UniformsUtils.clone(filmShader.uniforms), bloom: 0, radius: 0, threshold: 0, streak: 0, shockPoint: null, rayPoint: null, rays: 0 };
const cd = { uniforms: post.uniforms };
let overlayTime = 0, overlaySettings = null;
let Ie, Dn, wi, Wn, ai, overlayCamera;
function drawOverlay(context, camera, width, height) {
  Ie=context; overlayCamera=camera; Dn=wi=width; Wn=ai=height;
  Ie.clearRect(0,0,width,height);
  if(overlaySettings?.flares) RS(overlaySettings, 0);
  CS(overlayTime, 0);
}
'''
app=s[s.index('var yu = window.__ASSETS.timeline'):s.index('  let w = s.refl &&',s.index('function AS('))]
app=app.replace('window.__ASSETS.timeline','timeline')
post_update=s[s.index('  let _ = cd.uniforms;',s.index('function AS(')):s.index(' Co.render(),',s.index('function AS('))]
# The last comma expression is joined to Co.render in the original.
post_update=post_update.rstrip().rstrip(',')+';\n'
app+='''
  post.bloom = s.bloom; post.radius = s.bloomR; post.threshold = s.bloomT; post.streak = s.streak;
  overlayTime = i26; overlaySettings = s;
'''+post_update+'''
  post.shockPoint = K?.s.p || null; post.rayPoint = ie; post.rays = s.rays || 0;
'''
app+='''
  Pt.uReflOn.value = 0; Pt.uBGOn.value = 0;
  return { caption: hr ? (hr.who ? `${hr.who}「${hr.text}」` : hr.text) : '', title: ci?.a > 0.01 ? ci.main : '', subtitle: ci?.sub || '', fade: Math.max(s.fade || 0, o.fade), shot: r.b0 };
}
return { scene: lt, camera: Ye, update: AS, post, drawOverlay, shots: Xa.map(s => ({ start: s.t0, end: s.t1 })), uniforms: Pt,
  dispose() {
    const resources = new Set();
    lt.traverse(o => { if(o.geometry) resources.add(o.geometry); for(const m of (Array.isArray(o.material) ? o.material : o.material ? [o.material] : [])) { resources.add(m); for(const v of Object.values(m)) if(v?.isTexture) resources.add(v); } });
    for(const t of Object.values(Fa || {})) resources.add(t);
    for(const r of resources) r.dispose();
    for(const target of envTargets) target.dispose();
    for(const c of [fe,ze,De]) {c.mixer.stopAllAction(); c.mixer.uncacheRoot(c.root);}
    lt.clear();
  }
};
'''
app+=s[s.index('function RS('):s.index('function IS(')].replace('.project(Ye)', '.project(overlayCamera)')
prefix='''import timeline from './timeline.json';
import { UniformsUtils } from 'three';
import { filmShader } from './film-post.js';
import { Vector3 as C, AnimationMixer as da, QuaternionKeyframeTrack as yi, AnimationClip as ss, TextureLoader as Qs, Color as re, SRGBColorSpace as kt, Group as Zt, Box3 as Cn, MeshBasicMaterial as mt, Mesh as Te, SphereGeometry as es, IcosahedronGeometry as $s, Quaternion as vt, Euler as rn, Vector2 as xe, Matrix4 as Oe, Vector4 as et, ShaderMaterial as We, BackSide as mn, BoxGeometry as Wt, InstancedMesh as Zn, InstancedBufferAttribute as Ut, PlaneGeometry as Pn, CylinderGeometry as pn, MeshStandardMaterial as bn, CanvasTexture as Js, AdditiveBlending as Ft, DoubleSide as Jt, ConeGeometry as eo, BufferGeometry as dt, BufferAttribute as Je, LineSegments as _i, Points as Di, SpriteMaterial as Li, Sprite as Qi, RingGeometry as ra, TetrahedronGeometry as js, PointLight as ii, HemisphereLight as tr, LineBasicMaterial as ws, DynamicDrawUsage as Kc, InstancedBufferGeometry as ua, Scene as Zr, FogExp2 as Zo, PerspectiveCamera as Kt, DirectionalLight as Cs, CatmullRomCurve3 as sa } from 'three';
import { mergeGeometries as Bm } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as ru } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { PMREMGenerator as po } from 'three';
export async function createFilm({assetUrl, renderer}) {
const nS = path => new GLTFLoader().loadAsync(assetUrl(path));
'''
(out/'src/film.js').write_text(prefix+body+init+app+'\n}\n',encoding='utf-8')
(out/'source-info.json').write_text(json.dumps({'htmlSHA256':hashlib.sha256(src.read_bytes()).hexdigest(),'audioSHA256':hashlib.sha256(audio.read_bytes()).hexdigest(),'source':src.name,'duration':213.9},indent=2),encoding='utf-8')
print('Extracted to',out)
