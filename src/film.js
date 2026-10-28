import timeline from './timeline.json';
import { UniformsUtils } from 'three';
import { filmShader } from './film-post.js';
import { Vector3 as C, AnimationMixer as da, QuaternionKeyframeTrack as yi, AnimationClip as ss, TextureLoader as Qs, Color as re, SRGBColorSpace as kt, Group as Zt, Box3 as Cn, MeshBasicMaterial as mt, Mesh as Te, SphereGeometry as es, IcosahedronGeometry as $s, Quaternion as vt, Euler as rn, Vector2 as xe, Matrix4 as Oe, Vector4 as et, ShaderMaterial as We, BackSide as mn, BoxGeometry as Wt, InstancedMesh as Zn, InstancedBufferAttribute as Ut, PlaneGeometry as Pn, CylinderGeometry as pn, MeshStandardMaterial as bn, CanvasTexture as Js, AdditiveBlending as Ft, DoubleSide as Jt, ConeGeometry as eo, BufferGeometry as dt, BufferAttribute as Je, LineSegments as _i, Points as Di, SpriteMaterial as Li, Sprite as Qi, RingGeometry as ra, TetrahedronGeometry as js, PointLight as ii, HemisphereLight as tr, LineBasicMaterial as ws, DynamicDrawUsage as Kc, InstancedBufferGeometry as ua, Scene as Zr, FogExp2 as Zo, PerspectiveCamera as Kt, DirectionalLight as Cs, CatmullRomCurve3 as sa } from 'three';
import { mergeGeometries as Bm } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as ru } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { PMREMGenerator as po } from 'three';
export async function createFilm({assetUrl, renderer}) {
const nS = path => new GLTFLoader().loadAsync(assetUrl(path));
function iS(i26) {
  let e = {};
  return i26.traverse((t) => {
    t.isBone && (e[t.name] = t);
  }), e;
}
function cs(i26) {
  let e = new vt();
  return i26.getWorldQuaternion(e), e;
}
function oi(i26) {
  let e = new C();
  return i26.getWorldPosition(e), e;
}
function cu(i26, e) {
  let t = ru(i26.scene), n = new da(t), s = iS(t), r = () => {
    if (n.stopAllAction(), t.traverse((o) => {
      o.userData._bind && (o.quaternion.copy(o.userData._bind.q), o.position.copy(o.userData._bind.p));
    }), e) {
      let o = n.clipAction(e);
      o.play(), o.time = 0, n.update(0), o.stop();
    }
    t.updateMatrixWorld(true);
  };
  return t.traverse((o) => {
    o.userData._bind = { q: o.quaternion.clone(), p: o.position.clone() };
  }), { root: t, mixer: n, bones: s, setRest: r };
}
function kf(i26) {
  let e = oi(i26.bones.mixamorigLeftArm), n = oi(i26.bones.mixamorigRightArm).sub(e);
  return n.y = 0, n.normalize();
}
function ls(i26, e, t, n = 30) {
  i26.setRest(), e.setRest();
  let s = Object.keys(e.bones).filter((x) => i26.bones[x]), r = {}, o = {};
  for (let x of s) r[x] = cs(i26.bones[x]), o[x] = cs(e.bones[x]);
  let a = kf(i26), l = kf(e), c = new vt().setFromUnitVectors(a, l), u = c.clone().invert(), f = [];
  e.root.traverse((x) => {
    x.isBone && i26.bones[x.name] && f.push(x.name);
  });
  let h = "mixamorigHips", d = oi(i26.bones[h]).y, g = oi(e.bones[h]).y, y = e.bones[h].position.clone(), m = Math.max(2, Math.ceil(t.duration * n) + 1), p = new Float32Array(m), M = Object.fromEntries(f.map((x) => [x, new Float32Array(m * 4)])), w = new Float32Array(m * 3), _ = i26.mixer.clipAction(t);
  _.play();
  let b = {};
  for (let x = 0; x < m; x++) {
    let E = Math.min(t.duration, x / n);
    p[x] = E, _.time = E, i26.mixer.update(0), i26.root.updateMatrixWorld(true);
    for (let P of f) {
      let B = cs(i26.bones[P]).multiply(r[P].clone().invert()), z = c.clone().multiply(B).multiply(u).multiply(o[P]);
      b[P] = z;
      let Y = e.bones[P], ie = (Y.parent && Y.parent.isBone && b[Y.parent.name] ? b[Y.parent.name] : cs(Y.parent)).clone().invert().multiply(z);
      M[P].set([ie.x, ie.y, ie.z, ie.w], x * 4);
    }
    let I = (oi(i26.bones[h]).y - d) / d;
    w.set([I, 0, 0], x * 3);
  }
  _.stop();
  let T = f.map((x) => new yi(`${x}.quaternion`, p, M[x])), A = new ss(t.name, t.duration, T);
  return A.userData = { hipY: w, fps: n }, A;
}
var rS = async (path) => { const tex = await new Qs().loadAsync(assetUrl(path)); tex.flipY = false; return tex; }, Fa = null;
function oS(i26) {
  i26.map = Fa.base, i26.emissiveMap = Fa.em, i26.emissive = new re(0.35, 0.85, 1), i26.emissiveIntensity = 0.7, i26.metalnessMap = Fa.mr, i26.roughnessMap = Fa.mr, i26.metalness = 1, i26.roughness = 1, i26.envMapIntensity = 1, i26.color = new re(1, 1, 1), i26.needsUpdate = true;
}
async function Xm() {
  let [i26, e, t] = await Promise.all(["tex/mira_base.png", "tex/mira_emissive.png", "tex/mira_mr.png"].map(rS));
  i26.colorSpace = kt, e.colorSpace = kt, Fa = { base: i26, em: e, mr: t };
  let [n, s, r, o] = await Promise.all(["models/Soldier.glb", "models/Michelle.glb", "models/RobotExpressive.glb", "models/Xbot.glb"].map(nS)), a = (x) => Object.fromEntries(x.animations.map((E) => [E.name, E])), l = a(n), c = a(s), u = a(r), f = a(o), h = cu(n, l.TPose), d = cu(s, c.TPose), g = cu(o, null);
  function y(x, E, I, P) {
    let N = cu(x, E), B = new Zt();
    B.name = P;
    let D = new Zt();
    return B.add(D), D.add(N.root), N.root.traverse((z) => {
      z.isMesh && (z.frustumCulled = false, z.material && (z.material = z.material.clone(), P === "mira" && oS(z.material), P === "kai" && (z.material.roughness = 0.32, z.material.metalness = Math.max(z.material.metalness ?? 0, 0.55), z.material.envMapIntensity = 1.3), P === "nana" && (z.material.roughness = 0.25, z.material.metalness = 0.35, z.material.envMapIntensity = 1.2)));
    }), { holder: B, pivot: D, rig: N, root: N.root, mixer: N.mixer, bones: N.bones, name: P, actions: {} };
  }
  let m = y(n, l.TPose, 1.82, "kai"), p = y(s, c.TPose, 1.68, "mira"), M = y(r, null, 1.05, "nana"), w = (x) => ({ Idle: x === h ? l.Idle : ls(h, x, l.Idle), Run: x === h ? l.Run : ls(h, x, l.Run), Walk: x === h ? l.Walk : ls(h, x, l.Walk), Samba: x === d ? c.SambaDance : ls(d, x, c.SambaDance), sad: ls(g, x, f.sad_pose), agree: ls(g, x, f.agree), headShake: ls(g, x, f.headShake), sneak: ls(g, x, f.sneak_pose), xidle: ls(g, x, f.idle) }), _ = w(m.rig), b = w(p.rig);
  for (let [x, E] of [[m, _], [p, b], [M, u]]) for (let [I, P] of Object.entries(E)) {
    let N = P;
    E === u ? N = P : (N = P.clone(), N.tracks = N.tracks.filter((D) => D.name.endsWith(".quaternion")));
    let B = x.mixer.clipAction(N);
    B.play(), B.setEffectiveWeight(0), x.actions[I] = B;
  }
  for (let [x, E] of [[m, 1.82], [p, 1.68], [M, 1.05]]) {
    x.rig.setRest && x.mixer.update(0), x.holder.updateMatrixWorld(true);
    let I, P;
    if (x.bones.mixamorigHeadTop_End) I = oi(x.bones.mixamorigHeadTop_End).y, P = Math.min(oi(x.bones.mixamorigLeftToe_End).y, oi(x.bones.mixamorigLeftFoot).y) - 0;
    else {
      let B = new Cn().setFromObject(x.root, true);
      I = B.max.y, P = B.min.y;
    }
    let N = E / (I - P);
    if (x.pivot.scale.setScalar(N), x.pivot.position.y = -P * N, x.bones.mixamorigLeftArm) {
      let B = kf(x.rig), D = Math.atan2(B.z, B.x) - Math.atan2(0, -1);
      x.pivot.rotation.y = D;
    }
    x.baseY = x.pivot.position.y, x.scale = N, x.rest = {};
    for (let [B, D] of Object.entries(x.bones)) x.rest[B] = D.quaternion.clone();
  }
  let T = new mt({ color: new re(0.5, 1.2, 3.5), toneMapped: false }), A = new mt({ color: new re(0.6, 1.6, 4), toneMapped: false });
  M.eyeMat = T, M.coreMat = A, M.eyes = [0, 1].map(() => new Te(new es(0.045, 12, 10), T)), M.core = new Te(new $s(0.07, 1), A);
  for (let x of M.eyes) M.holder.add(x);
  return M.holder.add(M.core), { kai: m, mira: p, nana: M };
}
function qm(i26, e = 0) {
  i26.pivot.rotation.y = e, i26.holder.position.set(0, 0, 0), i26.holder.rotation.set(0, 0, 0);
  for (let u of Object.values(i26.actions)) u.setEffectiveWeight(0);
  i26.mixer.update(0), i26.holder.updateMatrixWorld(true);
  let t = i26.bones.Head, n = i26.bones.Torso_1 || i26.bones.Abdomen || i26.bones.Head.parent;
  i26.headRestQ = cs(t), i26.torsoRestQ = cs(n);
  let s = oi(t), r = oi(n), o = new URLSearchParams(), a = +(o.get("ex") || 0.1), l = +(o.get("ey") || 0.2), c = +(o.get("ez") || 0.2);
  i26.eyeOff = [new C(-0.21, 0.165, 0.265), new C(0.12, 0.17, 0.34)], i26.coreOff = new C(0, 0.02, 0.13);
}
function Ym(i26, e, t) {
  i26.holder.updateMatrixWorld(true);
  let n = i26.bones.Head, s = i26.bones.Torso_1 || i26.bones.Abdomen || i26.bones.Head.parent, r = cs(n).multiply(i26.headRestQ.clone().invert()), o = cs(s).multiply(i26.torsoRestQ.clone().invert()), l = i26.holder.getWorldQuaternion(new vt()).clone().invert(), c = oi(n), u = oi(s);
  i26.eyes.forEach((h, d) => {
    let g = c.clone().add(i26.eyeOff[d].clone().applyQuaternion(r));
    h.position.copy(i26.holder.worldToLocal(g));
  });
  let f = i26.coreOff.clone().applyQuaternion(o);
  i26.core.position.copy(i26.holder.worldToLocal(u.clone().add(f))), i26.eyeMat.color.setRGB(0.5 * e, 1.2 * e, 3.5 * e), i26.coreMat.color.setRGB(0.6 * t, 1.6 * t, 4 * t), i26.eyes.forEach((h) => h.visible = e > 0.02), i26.core.visible = t > 0.02;
}
function Oa(i26, e) {
  if (i26.rest) for (let [n, s] of Object.entries(i26.bones)) {
    let r = i26.rest[n];
    r && s.quaternion.copy(r);
  }
  for (let n of i26.mixer._bindings) {
    let s = n.valueSize;
    n.buffer.fill(1e9, s, 3 * s);
  }
  for (let n of Object.values(i26.actions)) n.setEffectiveWeight(0);
  let t = 0;
  for (let [n, [s, r]] of Object.entries(e)) {
    let o = i26.actions[n];
    if (!o) {
      console.log("missing clip", i26.name, n);
      continue;
    }
    let a = o.getClip().duration;
    o.setEffectiveWeight(r), o.time = Math.max(0, Math.min(s, a - 1e-3));
  }
  i26.mixer.update(0);
}
function cr(i26, e, t) {
  let n = i26.actions[e].getClip().duration;
  return (t % n + n) % n;
}
function Km(i26, e) {
  return i26.actions[e].getClip().duration;
}
var QE = new vt(), eT = new rn();
function rt(i26, e, t, n) {
  let s = i26.bones[e];
  if (!s) return;
  i26.holder.updateMatrixWorld(true);
  let r = cs(s.parent), o = new vt().setFromAxisAngle(t.clone().normalize(), n * Math.PI / 180), a = r.clone().multiply(s.quaternion);
  s.quaternion.copy(r.clone().invert().multiply(o.multiply(a))), s.updateMatrixWorld(true);
}

var wt = { uTime: { value: 0 }, uFogColor: { value: new re(656912) }, uFogDensity: { value: 4e-3 }, uCamPos: { value: new C() }, uDawn: { value: 0 }, uCrystGlow: { value: 0.3 }, uWinOn: { value: 1 }, uSunDir: { value: new C(0.3, 0.25, -1).normalize() }, uShatterT0: { value: 1e6 }, uShatterO: { value: new xe(0, -600) }, uShatterSpeed: { value: 140 }, uEpiR: { value: [1, 1, 1, 1] }, uRefl: { value: null }, uReflMat: { value: new Oe() }, uReflOn: { value: 0 }, uWet: { value: 1 }, uRainAmt: { value: 1 }, uBG: { value: null }, uRes: { value: new xe(1280, 536) }, uBGOn: { value: 0 }, uRiftE: { value: 0 }, uEpi: { value: [new et(0, 0, 1e6, 60), new et(0, 0, 1e6, 60), new et(0, 0, 1e6, 60), new et(0, 0, 1e6, 60)] } };
function Vn(i26) {
  return () => {
    i26 |= 0, i26 = i26 + 1831565813 | 0;
    let e = Math.imul(i26 ^ i26 >>> 15, 1 | i26);
    return e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, ((e ^ e >>> 14) >>> 0) / 4294967296;
  };
}
var yo = `
uniform vec3 uFogColor; uniform float uFogDensity; uniform vec3 uCamPos;
vec3 applyFog(vec3 col, vec3 w){ float d = length(w - uCamPos); float f = 1. - exp(-uFogDensity*uFogDensity*d*d); return mix(col, uFogColor, clamp(f,0.,1.)); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
`, Vf = `
uniform float uShatterT0; uniform vec2 uShatterO; uniform float uShatterSpeed;
float shatterT(vec3 w){ return uShatterT0 + length(w.xz - uShatterO)/uShatterSpeed; }
uniform vec4 uEpi[4]; uniform float uEpiR[4];
float crystT(vec3 w){ float t = 1e6; for(int i=0;i<4;i++){ float d = length(w.xz - uEpi[i].xy); if (d < uEpiR[i]) t = min(t, uEpi[i].z + d/uEpi[i].w + n2(w.xz*0.15)*0.8); } return t; }
`, uu = `
uniform sampler2D uRefl; uniform mat4 uReflMat; uniform float uReflOn, uWet, uRainAmt;
vec2 ripples(vec2 p, float t){
  vec2 acc = vec2(0.);
  for (int i=0;i<2;i++){
    float sc = i==0 ? 1.1 : 2.3;
    vec2 q = p*sc + float(i)*17.3; vec2 id = floor(q); vec2 f = fract(q) - 0.5;
    float h = h21(id); vec2 o = vec2(h21(id+3.1), h21(id+5.7)) - 0.5;
    vec2 d = f - o*0.6; float ph = fract(t*(0.7+h*0.6) + h*10.);
    float r = length(d); float x = r - ph*0.45;
    acc += d/(r+1e-3)*sin(x*70.)*exp(-x*x*300.)*(1.-ph);
  }
  return acc;
}
vec3 wetLayer(vec3 col, vec3 w, float amt){
  if (amt <= 0.001) return col;
  vec2 rn = ripples(w.xz, uTime)*uRainAmt;
  float puddle = smoothstep(0.38, 0.62, n2(w.xz*0.16));
  vec3 v = normalize(uCamPos - w);
  float fr = 0.03 + 0.97*pow(1.-clamp(v.y,0.,1.),5.);
  vec2 jit = (vec2(n2(w.xz*2.3), n2(w.zx*2.1)) - 0.5)*0.3*(1.-puddle) + rn*0.22;
  vec4 rp = uReflMat*vec4(w.x + jit.x, 0., w.z + jit.y, 1.);
  vec2 ruv = rp.xy/rp.w;
  float sp = mix(0.018, 0.004, puddle);
  vec3 refl = texture2D(uRefl, ruv).rgb*0.3 + (texture2D(uRefl, ruv + vec2(0., sp)).rgb + texture2D(uRefl, ruv - vec2(0., sp)).rgb)*0.22 + (texture2D(uRefl, ruv + vec2(0., sp*2.2)).rgb + texture2D(uRefl, ruv - vec2(0., sp*2.2)).rgb)*0.13;
  float k = amt*mix(0.3, 1.0, puddle)*mix(fr, 1., 0.35);
  col *= 1. - 0.4*amt;
  col += refl*k*uReflOn;
  col += vec3(0.35,0.45,0.65)*clamp(length(rn),0.,1.)*0.08*amt;
  return col;
}
`;
function Wf() {
  let i26 = new We({ side: mn, depthWrite: false, fog: false, uniforms: { uTime: wt.uTime, uDawn: wt.uDawn, uSunDir: wt.uSunDir, uRift: { value: 0 }, uRiftW: { value: 0 }, uFlash: { value: 0 }, uClub: { value: 0 } }, vertexShader: "varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }", fragmentShader: `
    varying vec3 vDir; uniform float uTime, uDawn, uRift, uRiftW, uFlash;  uniform vec3 uSunDir;
    float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }
    float fbm(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*n2(p); p*=2.03; a*=.5;} return s; }
    void main(){
      vec3 d = normalize(vDir); float el = d.y;
      // night
      vec3 night = mix(vec3(0.05,0.012,0.03), vec3(0.004,0.005,0.015), smoothstep(-0.02, 0.35, el));
      vec2 cp = d.xz/(max(el,0.03)+0.15)*1.2 + vec2(uTime*0.01, uTime*0.02);
      float cl = fbm(cp);
      night = mix(night, vec3(0.07,0.015,0.035)*(1.2-el), smoothstep(0.45,0.8,cl)*0.8*smoothstep(-0.05,0.2,el));
      // rift: centred toward -z at elevation ~0.45
      vec3 rc = normalize(vec3(0.05, 0.5, -1.));
      vec3 tu = normalize(cross(rc, vec3(0,1,0))), tv = cross(tu, rc);
      float u = dot(d, tu)*2.2, v = dot(d, tv)*2.2; float fwd = dot(d, rc);
      float jag = (fbm(vec2(u*6., 1.3))-.5)*0.25 + (n2(vec2(u*30.,4.))-.5)*0.03;
      float len = smoothstep(1.0*uRiftW+0.001, 0.0, abs(u));
      float dist = abs(v - jag);
      float core = exp(-dist*dist/(0.00002+0.0006*uRiftW*len)) * len;
      float glow = exp(-dist/(0.02+0.12*uRiftW)) * len;
      vec3 rift = (vec3(1.5,2.4,3.2)*core*4. + vec3(0.1,0.35,1.0)*glow*1.5) * uRift * step(0., fwd);
      // clouds lit by rift
      night += vec3(0.05,0.15,0.4)*glow*uRift*cl*1.5;
      // dawn
      float sd = max(dot(d, uSunDir), 0.);
      vec3 dawn = mix(vec3(1.0,0.45,0.25), vec3(0.18,0.32,0.62), smoothstep(-0.05, 0.6, el));
      dawn = mix(dawn, vec3(1.2,0.7,0.5), smoothstep(0.5,0.9,cl)*0.5*smoothstep(-0.02,0.3,el));
      dawn += vec3(3.,1.8,1.)*pow(sd, 400.)*4. + vec3(1.,0.5,0.25)*pow(sd,8.)*0.9;
      vec3 col = mix(night, dawn, uDawn) + rift*(1.-uDawn) + vec3(0.6,0.8,1.)*uFlash;
      gl_FragColor = vec4(col, 1.);
    }` }), e = new Te(new es(4e3, 48, 24), i26);
  return e.frustumCulled = false, e.renderOrder = -10, e;
}
var ki = -300, us = -540, za = -640;
function Xf() {
  let i26 = new Zt(), e = Vn(42), t = [], n = (M, w, _, b, T) => t.push({ x: M, z: w, w: _, d: b, h: T, seed: e() });
  for (let M = -420; M <= 420; M += 42) for (let w = 300; w >= -1e3; w -= 42) if (!(w < ki + 10 && w > us - 10 || Math.hypot(M, w - za) < 120)) for (let b = 0; b < 4; b++) {
    let T = b % 2 * 17 - 8.5, A = Math.floor(b / 2) * 17 - 8.5, x = M + T + (e() - 0.5) * 3, E = w + A + (e() - 0.5) * 3;
    if (Math.abs(x) < 16 || Math.abs(x - 22) < 14 && Math.abs(E) < 14) continue;
    let I = Math.exp(-(x * x + (E + 250) ** 2) / (300 * 300)), P = 12 + Math.pow(e(), 2.2) * 110 * (0.4 + I) + (e() < 0.05 ? 90 : 0);
    n(x, E, 12 + e() * 4, 12 + e() * 4, P);
  }
  n(24, 0, 20, 22, 42);
  let s = new Wt(1, 1, 1);
  s.translate(0, 0.5, 0);
  let r = new We({ uniforms: wt, vertexShader: `attribute float aSeed; varying vec3 vW; varying vec3 vN; flat varying float vSeed;
      void main(){ vec4 w = modelMatrix*instanceMatrix*vec4(position,1.); vW=w.xyz; vN=normal; vSeed=aSeed; gl_Position=projectionMatrix*viewMatrix*w; }`, fragmentShader: yo + Vf + `
      uniform float uTime, uDawn, uCrystGlow, uWinOn; uniform vec3 uSunDir;
      varying vec3 vW; varying vec3 vN; flat varying float vSeed;

      float windowHash(vec2 cell, float salt) {
        uvec2 p = uvec2(ivec2(cell));
        uint h = p.x * 1597334677u ^ p.y * 3812015801u ^ uint(vSeed * 65535. + .5) ^ uint(salt);
        h ^= h >> 16; h *= 2246822519u; h ^= h >> 13; h *= 3266489917u; h ^= h >> 16;
        return float(h >> 8) / 16777216.;
      }
      void main(){
        vec3 n = normalize(vN); float isTop = step(0.5, n.y);
        vec2 uv = abs(n.x)>0.5 ? vec2(vW.z, vW.y) : vec2(vW.x, vW.y);
        vec2 cs = vec2(2.6,3.4); vec2 grid = uv/cs; vec2 cell = floor(grid); vec2 f = fract(grid);
        vec2 fw = max(fwidth(grid), vec2(0.0001));
        float distant = smoothstep(0.35, 1.5, max(fw.x, fw.y));
        float win = (smoothstep(0.16-fw.x,0.16+fw.x,f.x)*(1.-smoothstep(0.84-fw.x,0.84+fw.x,f.x)) * smoothstep(0.2-fw.y,0.2+fw.y,f.y)*(1.-smoothstep(0.8-fw.y,0.8+fw.y,f.y)))*(1.-isTop)*step(2.5, vW.y);
        float r = windowHash(cell, 0.);
        float lit = step(0.74, r) * uWinOn;
        vec3 wc = mix(vec3(1.0,0.66,0.38), vec3(0.4,0.75,1.2), step(0.8, windowHash(cell, 13.)));
        wc = mix(wc, vec3(1.3,0.25,0.45), step(0.95, windowHash(cell, 29.)));

        vec3 meanWindow = mix(mix(vec3(1.,0.66,0.38),vec3(0.4,0.75,1.2),0.2),vec3(1.3,0.25,0.45),0.05);
        vec3 windowLight = lit*wc*(0.35+0.75*windowHash(cell, 47.))+(1.-lit)*vec3(0.015,0.018,0.026);
        windowLight = mix(windowLight,0.26*uWinOn*meanWindow*0.725+(1.-0.26*uWinOn)*vec3(0.015,0.018,0.026),distant);
        win = mix(win,0.408*(1.-isTop)*smoothstep(2.3,2.7,vW.y),distant);
        lit = mix(lit,0.26*uWinOn,distant);
        vec3 col = vec3(0.012,0.014,0.02) + win*windowLight;
        col += (1.-isTop)*exp(-vW.y/14.)*vec3(0.30,0.03,0.09)*0.5;
        col += isTop*vec3(0.015,0.015,0.025);
        float sun = max(dot(n, uSunDir), 0.);
        vec3 dcol = vec3(0.13,0.11,0.12)*(0.35+1.4*sun)*vec3(1.25,0.9,0.75) + win*vec3(0.25,0.3,0.4)*(0.2+0.8*sun) + isTop*vec3(0.05,0.05,0.07);
        col = mix(col, dcol, uDawn);
        // crystallisation
        float ct = crystT(vW) + vSeed*1.5 + vW.y*0.015;
        float st = shatterT(vW);
        float c = smoothstep(ct, ct+1.2, uTime) * (1. - smoothstep(st, st+0.8, uTime));
        float ptch = n2(vW.xy*0.08 + vW.zy*0.08 + vSeed*9.);
        c *= step(ptch, c*1.2);
        if (c > 0.) {
          float facet = h21(floor(vec2(dot(vW.xz, vec2(0.21,0.13)) + vW.y*0.11, vW.y*0.17 - dot(vW.xz,vec2(0.07,0.19)))));
          vec3 v = normalize(uCamPos - vW);
          float fr = pow(1. - abs(dot(n, v)), 3.);
          vec3 ice = vec3(0.02,0.06,0.16)*(0.4+0.9*facet) + vec3(0.25,0.5,0.9)*pow(fr,1.5)*0.35;
          float edge = (step(0.965, fract(dot(vW.xz, vec2(0.21,0.13)) + vW.y*0.11)) + step(0.97, fract(vW.y*0.17 - dot(vW.xz,vec2(0.07,0.19)))))*0.4;
          ice += vec3(0.2,0.55,1.3)*edge*(0.3+uCrystGlow*0.8);
          ice += vec3(0.15,0.4,1.1)*uCrystGlow*(0.3+0.7*sin(vW.y*0.3 - uTime*5. + vSeed*6.))*0.25;
          ice += win*lit*vec3(0.3,0.6,1.1)*0.4;
          col = mix(col, ice, c*0.9);
          float flash = smoothstep(st-0.3, st, uTime)*(1.-smoothstep(st, st+0.6, uTime));
          col += vec3(1.6,1.3,0.9)*flash*c*0.9;
        }
        gl_FragColor = vec4(applyFog(col, vW), 1.);
      }` }), o = new Zn(s, r, t.length), a = new Float32Array(t.length), l = new Oe();
  t.forEach((M, w) => {
    l.makeScale(M.w, M.h, M.d), l.setPosition(M.x, 0, M.z), o.setMatrixAt(w, l), a[w] = M.seed;
  }), s.setAttribute("aSeed", new Ut(a, 1)), o.frustumCulled = false, i26.add(o), i26.userData.boxes = t;
  let c = new We({ uniforms: wt, vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }", fragmentShader: yo + Vf + "uniform float uTime, uDawn, uCrystGlow;" + uu + `
      varying vec3 vW;
      void main(){
        vec3 col = vec3(0.012,0.012,0.016);
        float ax = abs(vW.x);
        // avenue markings
        float dash = step(0.5, fract(vW.z/8.)) * step(ax, 0.12);
        float edge = step(abs(ax-7.6), 0.1);
        col += vec3(0.25,0.22,0.15)*(dash+edge)*0.5;
        // sidewalk
        col += step(8., ax)*step(ax, 15.)*vec3(0.012);
        // wet reflections: lamps (cyan) + signs (red/pink)
        float lz = fract(vW.z/20.)-0.5;
        float lamp = exp(-lz*lz*60.) * exp(-pow(ax-7.,2.)*0.08);
        float puddle = smoothstep(0.45,0.7, n2(vW.xz*0.35));
        float sig = exp(-pow(ax-12.,2.)*0.05)*(0.5+0.5*sin(vW.z*0.21));
        col += (vec3(0.25,0.6,1.0)*lamp*0.7 + vec3(1.0,0.1,0.25)*sig*0.25)*(0.35+0.9*puddle)*(1.-uReflOn*0.7);
        col = mix(col, vec3(0.09,0.085,0.09)*(0.6+0.4*puddle), uDawn);
        float ct = crystT(vW); float st = shatterT(vW);
        float c = smoothstep(ct, ct+0.8, uTime)*(1.-smoothstep(st, st+0.8, uTime));
        vec2 r1 = vec2(dot(vW.xz, vec2(0.8,0.6)), dot(vW.xz, vec2(-0.6,0.8)))*0.45;
        vec2 r2 = vec2(dot(vW.xz, vec2(0.2,0.98)), dot(vW.xz, vec2(-0.98,0.2)))*0.37;
        float cells = h21(floor(r1)) * 0.5 + h21(floor(r2)) * 0.5;
        float cedge = max(step(0.975, fract(r1.x)) , step(0.975, fract(r2.y)))*0.35;
        c *= step(n2(vW.xz*0.12)*0.6, c);
        vec3 ice = vec3(0.015,0.05,0.13)*(0.4+cells*1.2) + vec3(0.2,0.5,1.2)*cedge*(0.2+uCrystGlow*0.6) + vec3(0.15,0.4,1.1)*uCrystGlow*0.15*(0.5+0.5*sin(length(vW.xz)*0.2-uTime*6.));
        col = mix(col, ice, c*0.9);
        col = wetLayer(col, vW, uWet*(1.-c*0.3));
        gl_FragColor = vec4(applyFog(col, vW), 1.);
      }` }), u = new Te(new Pn(1e3, 600).rotateX(-Math.PI / 2), c);
  u.position.set(0, 0, 0);
  let f = new Te(new Pn(1e3, 480).rotateX(-Math.PI / 2), c);
  f.position.set(0, 0, -780), i26.add(u, f), i26.userData.grounds = [u, f];
  let h = new We({ uniforms: wt, vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }", fragmentShader: yo + `uniform float uTime, uDawn; varying vec3 vW;
      void main(){ float w = n2(vW.xz*vec2(0.05,0.4) + vec2(0., uTime*0.3)); vec3 v = normalize(uCamPos - vW); float fr = pow(1.-max(v.y,0.),5.);
        vec3 col = vec3(0.005,0.008,0.015) + vec3(0.9,0.15,0.3)*pow(w,6.)*0.4 + vec3(0.2,0.5,1.)*pow(n2(vW.xz*0.3+uTime*0.1),8.)*0.8;
        col = mix(col, vec3(0.8,0.45,0.35)*(0.4+0.6*fr) + vec3(1.5,0.9,0.5)*pow(w,5.)*1.5, uDawn);
        gl_FragColor = vec4(applyFog(col, vW), 1.); }` }), d = new Te(new Pn(2e3, 260).rotateX(-Math.PI / 2), h);
  d.position.set(0, -35, -420), i26.add(d);
  let g = [], y = [];
  for (let M = 300; M > -1e3; M -= 20) if (!(M < ki && M > us)) for (let w of [-1, 1]) g.push([w * 8.2, 7, M]), y.push([w * 8.4, 0, M]);
  let m = new Zn(new Wt(1.4, 0.18, 0.35), new mt({ color: new re(1.2, 2.2, 3.2) }), g.length), p = new Zn(new pn(0.08, 0.1, 7, 6).translate(0, 3.5, 0), new bn({ color: 2236968, roughness: 0.6, metalness: 0.5 }), y.length);
  return g.forEach((M, w) => {
    l.makeTranslation(M[0] * 0.93, M[1], M[2]), m.setMatrixAt(w, l);
  }), y.forEach((M, w) => {
    l.makeTranslation(...M), p.setMatrixAt(w, l);
  }), m.frustumCulled = p.frustumCulled = false, i26.add(m, p), i26.userData.lampMat = m.material, i26;
}
function Zm(i26, e, t = 512, n = 128, s = false, r = '900 90px "Noto Sans CJK JP"') {
  let o = document.createElement("canvas");
  o.width = t, o.height = n;
  let a = o.getContext("2d");
  if (a.fillStyle = "rgba(0,0,0,0)", a.fillRect(0, 0, t, n), a.font = r, a.textAlign = "center", a.textBaseline = "middle", a.shadowColor = e, a.shadowBlur = 18, a.fillStyle = "#fff", s) {
    let c = [...i26], u = n / c.length;
    c.forEach((f, h) => a.fillText(f, t / 2, u * (h + 0.5)));
  } else a.fillText(i26, t / 2, n / 2);
  a.shadowBlur = 0, a.strokeStyle = e, a.lineWidth = 6, a.strokeRect(6, 6, t - 12, n - 12);
  let l = new Js(o);
  return l.colorSpace = kt, l.anisotropy = 4, l;
}
function qf() {
  let i26 = new Zt(), e = Vn(7), t = ["\u0417\u0410 \u041D\u0410\u0421", "\u30CD\u30AA\u30F3", "\u30AB\u30E9\u30AA\u30B1", "24H", "\u30E9\u30FC\u30E1\u30F3", "HOTEL", "BAR 7", "\u0421\u0412\u0415\u0422", "\u672A\u6765", "\u30B2\u30FC\u30E0", "\u0414\u041E\u041C", "\u55AB\u8336", "CLUB M", "\u5149", "\u041E\u0422\u0415\u041B\u042C", "\u591C"], n = [["#ff2a55", [3, 0.4, 0.8]], ["#28d8ff", [0.5, 2.2, 3.2]], ["#ff39d0", [2.6, 0.5, 2.4]], ["#ffb02a", [3, 1.6, 0.4]], ["#6a5bff", [1.2, 1, 3.2]]], s = [];
  for (let l = 0; l < 90; l++) {
    let c = 280 - l * 7.3 - e() * 3;
    if (c < ki + 12) break;
    let u = e() < 0.5 ? -1 : 1, f = t[e() * t.length | 0], h = e() < 0.5, [d, g] = n[e() * n.length | 0], y = Zm(f, d, h ? 128 : 512, h ? 512 : 128, h, h ? '900 84px "Noto Sans CJK JP"' : '900 80px "Noto Sans CJK JP"'), m = new mt({ map: y, transparent: true, blending: Ft, depthWrite: false, side: Jt, color: new re(...g) });
    m.userData.base = new re(...g), m.userData.flick = e(), s.push(m);
    let p = h ? 1.6 : 6, M = h ? 6.4 : 1.5, w = new Te(new Pn(p, M), m);
    h ? (w.position.set(u * 9.4, 6 + e() * 14, c), w.rotation.y = Math.PI / 2 * u, w.rotation.y = 0) : (w.position.set(u * 10.1, 5 + e() * 18, c), w.rotation.y = -u * Math.PI / 2), i26.add(w);
  }
  let r = Zm("\u0417\u0410 \u041D\u0410\u0421", "#ff2a55", 1024, 256, false, '900 170px "Noto Sans CJK JP"'), o = new mt({ map: r, transparent: true, blending: Ft, depthWrite: false, side: Jt, color: new re(3.2, 0.35, 0.8) });
  o.userData.base = o.color.clone(), o.userData.flick = 0.3, s.push(o);
  let a = new Te(new Pn(16, 4), o);
  return a.position.set(16, 46.5, 4), a.rotation.y = -Math.PI / 2, i26.add(a), i26.userData.mats = s, i26;
}
function Yf() {
  let i26 = new Zt(), e = new bn({ color: 1710626, roughness: 0.8, metalness: 0.3 }), t = new Te(new Wt(20, 0.3, 22), new bn({ color: 1381658, roughness: 0.35, metalness: 0.2 }));
  t.position.set(24, 42, 0), i26.add(t);
  for (let [a, l, c, u] of [[14.2, 0, 0.1, 22], [24, 10.9, 20, 0.1], [24, -10.9, 20, 0.1]]) {
    let f = new Te(new Wt(c, 0.08, u), e);
    f.position.set(a, 43.1, l), i26.add(f);
  }
  for (let a = -10.5; a <= 10.5; a += 1.5) {
    let l = new Te(new Wt(0.06, 1.1, 0.06), e);
    l.position.set(14.2, 42.6, a), i26.add(l);
  }
  let n = new Te(new pn(2, 2, 4, 16), e);
  n.position.set(30, 46, -6), i26.add(n);
  let s = new Te(new pn(0.05, 0.1, 12, 6), e);
  s.position.set(31, 48, 7), i26.add(s);
  let r = new Te(new es(0.25, 8, 6), new mt({ color: new re(4, 0.2, 0.2) }));
  r.position.set(31, 54.1, 7), i26.add(r), i26.userData.blink = r;
  let o = new Te(new Wt(0.2, 5, 16.5), e);
  return o.position.set(16.3, 46.5, 4), i26.add(o), i26;
}
function hu() {
  let i26 = new pn(0.28, 0.36, 1.4, 6, 1, true);
  i26.translate(0, 0.7, 0);
  let e = new eo(0.28, 0.6, 6, 1, true);
  e.translate(0, 1.7, 0);
  let t = Bm([i26.toNonIndexed(), e.toNonIndexed()]);
  return t.computeVertexNormals(), t;
}
function Jm(i26 = {}) {
  return new We({ uniforms: { ...wt, ...i26 }, vertexShader: `attribute float aBirth; attribute float aDeath; attribute float aSeed; uniform float uTime;
      varying vec3 vN; varying vec3 vW; varying float vSeed; varying float vDeath;
      void main(){
        float g = clamp((uTime - aBirth)/0.45, 0., 1.); g = 1. - pow(1.-g, 3.) + sin(g*3.14159)*0.15;
        float d = 1. - clamp((uTime - aDeath)/0.3, 0., 1.);
        float s = g*d;
        vec3 p = position * vec3(1., s, 1.) * (0.35 + 0.65*s);
        mat3 im = mat3(instanceMatrix);
        vN = normalize(mat3(modelMatrix)*im*normal);
        vec4 w = modelMatrix*instanceMatrix*vec4(p,1.); vW = w.xyz; vSeed = aSeed; vDeath = aDeath;
        gl_Position = projectionMatrix*viewMatrix*w;
        if (s <= 0.001) gl_Position = vec4(2.,2.,2.,1.);
      }`, fragmentShader: yo + `uniform float uTime, uCrystGlow, uDawn, uBGOn, uRiftE; uniform sampler2D uBG; uniform vec2 uRes;
      varying vec3 vN; varying vec3 vW; varying float vSeed; varying float vDeath;
      vec3 envC(vec3 r){
        vec3 night = mix(vec3(0.06,0.015,0.04), vec3(0.01,0.012,0.035), smoothstep(-0.1,0.5,r.y));
        night += vec3(0.9,0.1,0.3)*pow(max(0.,1.-abs(r.y+0.05)*4.),3.)*0.45;
        night += vec3(0.2,0.5,1.3)*pow(max(dot(r, normalize(vec3(0.05,0.5,-1.))),0.),20.)*uRiftE*2.;
        vec3 dawn = mix(vec3(1.1,0.55,0.35), vec3(0.3,0.45,0.75), smoothstep(-0.1,0.6,r.y));
        return mix(night, dawn, uDawn);
      }
      void main(){
        vec3 n = normalize(vN); vec3 v = normalize(uCamPos - vW);
        float cs = abs(dot(n, v));
        float fr = 0.05 + 0.95*pow(1. - cs, 4.);
        float facet = h21(floor(n.xz*3.7 + vSeed*13.));
        vec2 suv = gl_FragCoord.xy/uRes;
        vec3 vn = normalize(mat3(viewMatrix)*n);
        vec2 off = vn.xy*(0.03 + 0.05*facet);
        vec3 refr = vec3(texture2D(uBG, suv + off).r, texture2D(uBG, suv + off*1.18).g, texture2D(uBG, suv + off*1.36).b);
        vec3 col = mix(vec3(0.02,0.07,0.2)*(0.35+0.9*facet), refr*vec3(0.5,0.72,1.0) + vec3(0.005,0.02,0.05), uBGOn);
        vec3 r = reflect(-v, n);
        col += envC(r)*fr*0.7;
        float lines = pow(1.-abs(sin(dot(vW, vec3(0.9,0.3,0.7))*1.7 + vSeed*20.)), 50.);
        col += vec3(0.3,0.7,1.5)*lines*0.35*(0.4+uCrystGlow);
        vec3 rainbow = 0.5+0.5*cos(6.2831*(fr*1.7 + vSeed + vec3(0.,0.33,0.67)));
        col += rainbow*pow(1.-cs, 3.)*0.28;
        float sd = pow(max(dot(r, normalize(vec3(0.4,0.7,0.3))),0.),10.) + pow(max(dot(r, normalize(vec3(-0.6,0.4,-0.5))),0.),10.);
        float spk = step(0.975, h21(floor(gl_FragCoord.xy*0.5) + floor(uTime*12.)*vec2(3.1,1.7)));
        col += vec3(2.,2.2,2.6)*(sd*spk*2.5 + sd*0.04);
        float pulse = 0.5+0.5*sin(vW.y*0.35 - uTime*6. + vSeed*6.28);
        col += vec3(0.15,0.45,1.3)*uCrystGlow*(0.15+0.85*pulse)*(0.3+fr)*0.4;
        float flash = smoothstep(vDeath-0.35, vDeath, uTime);
        col += vec3(1.6,1.3,0.8)*flash*0.45*(1.-smoothstep(vDeath, vDeath+0.2, uTime));
        col = mix(col, col*vec3(1.1,0.9,0.8)+vec3(0.3,0.2,0.15)*fr, uDawn*0.5);
        gl_FragColor = vec4(applyFog(col, vW), 1.);
      }` });
}
var Ba = class {
  constructor(e) {
    this.geo = hu(), this.max = e, this.n = 0, this.birth = new Float32Array(e).fill(1e6), this.death = new Float32Array(e).fill(1e6), this.seed = new Float32Array(e), this.pos = [], this.mesh = new Zn(this.geo, Jm(), e), this.mesh.frustumCulled = false, this.geo.setAttribute("aBirth", new Ut(this.birth, 1)), this.geo.setAttribute("aDeath", new Ut(this.death, 1)), this.geo.setAttribute("aSeed", new Ut(this.seed, 1));
    let t = new Oe().makeScale(0, 0, 0);
    for (let n = 0; n < e; n++) this.mesh.setMatrixAt(n, t);
    this._m = new Oe(), this._q = new vt(), this._e = new rn();
  }
  add(e, t, n, s, r, o = 1e6, a = Math.random()) {
    if (this.n >= this.max) return -1;
    let l = this.n++;
    return this._e.set(n[0], s, n[1]), this._q.setFromEuler(this._e), this._m.compose(new C(...e), this._q, new C(t[0], t[1], t[0])), this.mesh.setMatrixAt(l, this._m), this.birth[l] = r, this.death[l] = o, this.seed[l] = a, this.pos.push({ p: e, scale: t, birth: r, death: o, i: l }), l;
  }
  cluster(e, t, n, s, r, o = 1.5, a = 1e6) {
    for (let l = 0; l < n; l++) {
      let c = e() * Math.PI * 2, u = e() * o * s, f = [t[0] + Math.cos(c) * u, t[1] - 0.2, t[2] + Math.sin(c) * u], h = s * (0.4 + e() * 0.8);
      this.add(f, [h * 0.9, h * (1.2 + e() * 1.6)], [(e() - 0.5) * 1, (e() - 0.5) * 1], e() * 6, r + e() * 0.25, a, e());
    }
  }
  finalize() {
    this.mesh.instanceMatrix.needsUpdate = true;
    for (let e of ["aBirth", "aDeath", "aSeed"]) this.geo.attributes[e].needsUpdate = true;
  }
};
function Kf(i26 = 7e3) {
  let n = new Float32Array(i26 * 2 * 3), s = new Float32Array(i26 * 2), r = Vn(3);
  for (let c = 0; c < i26; c++) {
    let u = (r() - 0.5) * 2 * 40, f = r() * 40, h = (r() - 0.5) * 2 * 40;
    n.set([u, f, h, u, f, h], c * 6), s[c * 2] = 0, s[c * 2 + 1] = 1;
  }
  let o = new dt();
  o.setAttribute("position", new Je(n, 3)), o.setAttribute("aEnd", new Je(s, 1));
  let a = new We({ transparent: true, depthWrite: false, blending: Ft, uniforms: { uTime: wt.uTime, uCamPos: wt.uCamPos, uRain: { value: 1 }, uSlow: { value: 1 } }, vertexShader: `attribute float aEnd; uniform float uTime, uSlow; uniform vec3 uCamPos; varying float vA;
      void main(){ vec3 p = position; float R=40., H=40.;
        p.y = mod(p.y - uTime*22.*uSlow, H) - H*0.5;
        p.xz = mod(p.xz - uCamPos.xz + R, 2.*R) - R;
        vec3 w = uCamPos + p; w.y = uCamPos.y + p.y;
        w += aEnd*vec3(0.12, 0.9, 0.05)*(0.6+uSlow*0.6);
        vA = 1. - smoothstep(10., 38., length(p));
        gl_Position = projectionMatrix*viewMatrix*vec4(w,1.); }`, fragmentShader: "uniform float uRain; varying float vA; void main(){ gl_FragColor = vec4(vec3(0.35,0.45,0.6)*vA*uRain, 1.); }" }), l = new _i(o, a);
  return l.frustumCulled = false, l;
}
function Zf(i26 = 5e3) {
  let n = new Float32Array(i26 * 3), s = new Float32Array(i26), r = Vn(11);
  for (let c = 0; c < i26; c++) n.set([(r() - 0.5) * 2 * 30, r() * 24, (r() - 0.5) * 2 * 30], c * 3), s[c] = r();
  let o = new dt();
  o.setAttribute("position", new Je(n, 3)), o.setAttribute("aSeed", new Je(s, 1));
  let a = new We({ transparent: true, depthWrite: false, blending: Ft, uniforms: { uTime: wt.uTime, uCamPos: wt.uCamPos, uAmt: { value: 0 }, uEmber: { value: 0.5 }, uGold: { value: 0 }, uRise: { value: 0 }, uPx: { value: 1 } }, vertexShader: `attribute float aSeed; uniform float uTime, uRise, uPx; uniform vec3 uCamPos; varying float vS; varying float vA;
      void main(){ vec3 p = position; float R=30., H=24.;
        float fall = mix(-1.2, 2.0, uRise);
        p.y = mod(p.y + uTime*fall*(0.5+aSeed), H) - H*0.5;
        p.x += sin(uTime*0.7 + aSeed*30.)*1.5; p.z += cos(uTime*0.5 + aSeed*20.)*1.5;
        p.xz = mod(p.xz - uCamPos.xz + R, 2.*R) - R;
        vec3 w = uCamPos + p;
        vec4 mv = viewMatrix*vec4(w,1.);
        gl_Position = projectionMatrix*mv;
        gl_PointSize = min(uPx*(1.5+aSeed*3.)*40./max(-mv.z,1.), 9.);
        vS = aSeed; vA = (1.-smoothstep(12.,29.,length(p)))*smoothstep(0.8, 3., -mv.z); }`, fragmentShader: `uniform float uAmt, uEmber, uGold; varying float vS; varying float vA;
      void main(){ vec2 c = gl_PointCoord-0.5; float d = length(c); if(d>0.5) discard; float a = exp(-d*d*18.);
        vec3 col = vS < uEmber ? vec3(2.5,0.5,0.25) : vec3(0.6,1.4,2.6);
        col = mix(col, vec3(2.8,1.9,0.9), uGold);
        gl_FragColor = vec4(col*a*vA*uAmt, 1.); }` }), l = new Di(o, a);
  return l.frustumCulled = false, l;
}
function Jf(i26, e = 6) {
  let t = i26.pos.filter((h) => h.death < 1e5), n = t.length * e, s = new Float32Array(n * 3), r = new Float32Array(n * 3), o = new Float32Array(n), a = Vn(99), l = 0;
  for (let h of t) for (let d = 0; d < e; d++) {
    let g = h.scale[1] * 2 * a();
    s.set([h.p[0] + (a() - 0.5) * h.scale[0], h.p[1] + g, h.p[2] + (a() - 0.5) * h.scale[0]], l * 3), r.set([(a() - 0.5) * 6, 2 + a() * 8, (a() - 0.5) * 6], l * 3), o[l] = h.death + a() * 0.2, l++;
  }
  let c = new dt();
  c.setAttribute("position", new Je(s, 3)), c.setAttribute("aVel", new Je(r, 3)), c.setAttribute("aBirth", new Je(o, 1));
  let u = new We({ transparent: true, depthWrite: false, blending: Ft, uniforms: { uTime: wt.uTime, uPx: { value: 1 } }, vertexShader: `attribute vec3 aVel; attribute float aBirth; uniform float uTime, uPx; varying float vA;
      void main(){ float age = uTime - aBirth; vec3 w = position + aVel*age*0.6 + vec3(0., age*age*0.8, 0.);
        vA = age < 0. ? 0. : exp(-age*0.45)*smoothstep(0.,0.1,age);
        vec4 mv = viewMatrix*vec4(w,1.); gl_Position = projectionMatrix*mv;
        gl_PointSize = vA > 0. ? min(uPx*3.5*60./max(-mv.z,1.) + 1., 10.) : 0.; }`, fragmentShader: "varying float vA; void main(){ vec2 c=gl_PointCoord-.5; float d=length(c); if(d>.5) discard; gl_FragColor = vec4(vec3(0.8,0.6,0.35)*exp(-d*d*16.)*vA, 1.); }" }), f = new Di(c, u);
  return f.frustumCulled = false, f;
}
function aS() {
  let i26 = document.createElement("canvas");
  i26.width = i26.height = 128;
  let e = i26.getContext("2d"), t = e.createRadialGradient(64, 64, 0, 64, 64, 64);
  return t.addColorStop(0, "rgba(255,255,255,1)"), t.addColorStop(0.25, "rgba(255,255,255,0.45)"), t.addColorStop(1, "rgba(255,255,255,0)"), e.fillStyle = t, e.fillRect(0, 0, 128, 128), new Js(i26);
}
var Ha = aS(), Gf = class {
  constructor(e, t = 24) {
    this.items = [], this.list = [];
    for (let n = 0; n < t; n++) {
      let s = new Li({ map: Ha, blending: Ft, depthWrite: false, transparent: true, color: 16777215 }), r = new Qi(s);
      r.visible = false, e.add(r);
      let o = new mt({ color: 16777215, transparent: true, blending: Ft, depthWrite: false, side: Jt }), a = new Te(new ra(0.9, 1, 64).rotateX(-Math.PI / 2), o);
      a.visible = false, e.add(a), this.items.push({ s: r, r: a });
    }
  }
  set(e) {
    this.list = e;
  }
  update(e) {
    let t = 0;
    for (let n of this.list) {
      let s = e - n.t;
      if (s < 0 || s > (n.life || 2)) continue;
      if (t >= this.items.length) break;
      let { s: r, r: o } = this.items[t++], a = Math.exp(-s / (n.decay || 0.35));
      if (r.visible = true, r.position.set(...n.p), r.scale.setScalar(n.size * (0.6 + s * 1.5)), r.material.color.setRGB(n.color[0] * a, n.color[1] * a, n.color[2] * a), n.ring) {
        o.visible = true, o.position.set(n.p[0], n.ringY ?? 0.3, n.p[2]);
        let l = n.size * (0.5 + s * (n.ringSpeed || 12));
        o.scale.set(l, 1, l);
        let c = Math.exp(-s / 0.6);
        o.material.color.setRGB(0.5 * c * 2, 1 * c * 2, 2 * c * 2);
      } else o.visible = false;
    }
    for (; t < this.items.length; t++) this.items[t].s.visible = false, this.items[t].r.visible = false;
  }
}, fu = new C(0, 0, 3e3);
function $f() {
  let i26 = new Zt();
  i26.position.copy(fu);
  let e = new bn({ color: 789008, roughness: 0.9 }), t = new We({ uniforms: wt, vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }", fragmentShader: yo + "uniform float uTime;" + uu + `varying vec3 vW;
      void main(){ vec2 q = vW.xz*0.5; float tile = step(0.03, fract(q.x))*step(0.03, fract(q.y));
        vec3 col = vec3(0.012,0.01,0.016)*(0.6+0.4*tile);
        col = wetLayer(col, vW, 0.85);
        gl_FragColor = vec4(applyFog(col, vW), 1.); }` }), n = new Te(new Pn(34, 26).rotateX(-Math.PI / 2), t);
  i26.add(n), i26.userData.floor = n;
  let s = new Te(new Pn(34, 10), e);
  s.position.set(0, 5, -13), i26.add(s);
  let r = new Te(new Pn(26, 10), e);
  r.position.set(-17, 5, 0), r.rotation.y = Math.PI / 2, i26.add(r);
  let o = r.clone();
  o.position.x = 17, o.rotation.y = -Math.PI / 2, i26.add(o);
  let a = s.clone();
  a.position.z = 13, a.rotation.y = Math.PI, i26.add(a);
  let l = new Te(new Pn(34, 26).rotateX(Math.PI / 2), e);
  l.position.y = 10, i26.add(l);
  let c = new bn({ color: 3355448, metalness: 0.8, roughness: 0.4 });
  for (let E of [-6, 0, 6]) {
    let I = new Te(new Wt(30, 0.25, 0.25), c);
    I.position.set(0, 9.2, E), i26.add(I);
  }
  let u = new mt({ color: new re(4, 0.35, 0.6) }), f = new mt({ color: new re(0.6, 1.6, 4) }), h = (E, I, P) => {
    let N = new C().subVectors(I, E), B = new Te(new pn(0.06, 0.06, N.length(), 8), P);
    B.position.copy(E).addScaledVector(N, 0.5), B.quaternion.setFromUnitVectors(new C(0, 1, 0), N.clone().normalize()), i26.add(B);
  };
  for (let E of [-9, -5, 5, 9]) h(new C(E, 1.5, -12.9), new C(E, 8, -12.9), u);
  h(new C(-3, 8, -12.9), new C(0, 3.5, -12.9), u), h(new C(0, 3.5, -12.9), new C(3, 8, -12.9), u), h(new C(-14, 8.6, -12.8), new C(14, 8.6, -12.8), u);
  for (let E of [-8, -2, 4, 10]) h(new C(-16.9, 1.2, E), new C(-16.9, 4.2, E), u), h(new C(16.9, 1.2, E), new C(16.9, 4.2, E), f);
  i26.userData.neonMat = u, i26.userData.neonB = f;
  let d = new We({ transparent: true, depthWrite: false, blending: Ft, side: Jt, uniforms: { uCol: { value: new re(0.35, 0.55, 1) }, uI: { value: 1 } }, vertexShader: "varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = uv.y; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }", fragmentShader: "uniform vec3 uCol; uniform float uI; varying float vY; varying vec3 vN; varying vec3 vV; void main(){ float e = pow(abs(dot(vN, vV)), 2.0); gl_FragColor = vec4(uCol*uI*e*pow(clamp(vY,0.,1.),1.5)*0.12, 1.); }" });
  i26.userData.cones = [];
  for (let [E, I, P, N] of [[-6, -6, 0.25, 0.1], [6, -6, -0.25, 0.1], [0, -8, 0, 0.3], [-3, 2, 0.2, -0.1], [3, 2, -0.2, -0.1]]) {
    let B = new Te(new eo(2.2, 9.5, 24, 1, true), d.clone());
    B.geometry.translate(0, -4.75, 0), B.position.set(E, 9.2, I), B.rotation.set(P, 0, N), i26.add(B), i26.userData.cones.push(B);
  }
  let g = (() => {
    let E = document.createElement("canvas");
    E.width = E.height = 256;
    let I = E.getContext("2d"), P = Vn(5);
    for (let N = 0; N < 40; N++) {
      let B = 128 + (P() - 0.5) * 120, D = 128 + (P() - 0.5) * 80, z = 30 + P() * 70, Y = I.createRadialGradient(B, D, 0, B, D, z);
      Y.addColorStop(0, "rgba(255,255,255,0.12)"), Y.addColorStop(1, "rgba(255,255,255,0)"), I.fillStyle = Y, I.fillRect(0, 0, 256, 256);
    }
    return new Js(E);
  })(), y = [], m = Vn(8);
  for (let E = 0; E < 8; E++) {
    let I = new Li({ map: g, blending: Ft, depthWrite: false, transparent: true, color: new re(0.12, 0.07, 0.15), opacity: 0.5 }), P = new Qi(I);
    P.position.set((m() - 0.5) * 24, 0.8 + m() * 1.6, -3 - m() * 9), P.scale.set(9, 4.5, 1), i26.add(P), y.push(P);
  }
  i26.userData.fogs = y;
  let p = new bn({ color: 8949960, roughness: 0.5, metalness: 0.1, flatShading: true }), M = Vn(21);
  for (let E = 0; E < 9; E++) {
    let I = new Te(new js(0.6 + M() * 0.9), p);
    I.position.set(-2 + (M() - 0.5) * 5, 0.3, -9 + (M() - 0.5) * 3), I.rotation.set(M() * 3, M() * 3, M() * 3), i26.add(I);
  }
  let w = new Te(new Wt(8, 1.1, 1.2), new bn({ color: 2103328, roughness: 0.3, metalness: 0.7 }));
  w.position.set(10, 0.55, 6), i26.add(w);
  let _ = new Te(new Wt(8.2, 0.06, 1.4), new mt({ color: new re(1.6, 0.18, 0.32) }));
  _.position.set(10, 1.12, 6), i26.add(_);
  let b = new ii(16720452, 60, 30, 1.6);
  b.position.set(0, 6, -10), i26.add(b);
  let T = new ii(3368703, 40, 30, 1.6);
  T.position.set(8, 7, 4), i26.add(T);
  let A = new ii(16724855, 30, 25, 1.6);
  A.position.set(-8, 4, 6), i26.add(A);
  let x = new tr(6320383, 2097168, 0.6);
  return i26.add(x), i26.userData.lights = [b, T, A, x], i26;
}
function du() {
  let i26 = new Zt(), e = new Te(new pn(0.035, 0.03, 0.11, 12, 1, true), new mt({ color: new re(0.6, 0.7, 0.8), transparent: true, opacity: 0.35, side: Jt, depthWrite: false })), t = new Te(new pn(0.031, 0.028, 0.07, 12), new mt({ color: new re(2.5, 1.1, 0.3) }));
  return t.position.y = -0.015, i26.add(e, t), i26;
}
function jf() {
  let i26 = new Zt(), e = ki - us + 20, t = (ki + us) / 2, n = new We({ uniforms: wt, vertexShader: "varying vec3 vW; varying vec3 vN; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; vN=normal; gl_Position=projectionMatrix*viewMatrix*w; }", fragmentShader: yo + Vf + "uniform float uTime, uDawn, uCrystGlow;" + uu + `varying vec3 vW; varying vec3 vN;
      void main(){ vec3 col = vec3(0.014,0.014,0.02); float ax = abs(vW.x);
        col += vec3(0.25,0.22,0.15)*step(0.5, fract(vW.z/8.))*step(ax,0.12)*0.5*step(0.5,vN.y);
        float lz = fract(vW.z/12.)-0.5; col += vec3(0.25,0.6,1.)*exp(-lz*lz*40.)*exp(-pow(ax-7.,2.)*0.1)*0.6*step(0.5,vN.y);
        col = mix(col, vec3(0.1,0.09,0.1), uDawn);
        float ct = crystT(vW); float st = shatterT(vW);
        float c = smoothstep(ct, ct+0.6, uTime)*(1.-smoothstep(st, st+0.8, uTime)); vec2 r1 = vec2(dot(vW.xz, vec2(0.8,0.6)), dot(vW.xz, vec2(-0.6,0.8)))*0.45; float cells = h21(floor(r1)); float edge = (step(0.975, fract(r1.x)) + step(0.975, fract(r1.y)))*0.35;
        c *= step(n2(vW.xz*0.12)*0.6, c);
        col = mix(col, vec3(0.015,0.05,0.13)*(0.4+cells*1.2) + vec3(0.2,0.5,1.2)*edge*(0.2+uCrystGlow*0.6), c*0.9);
        if (vN.y > 0.5) col = wetLayer(col, vW, uWet*(1.-c*0.3));
        gl_FragColor = vec4(applyFog(col, vW), 1.); }` }), s = -466, r = -474, o = new Te(new Wt(16, 1.2, ki + 10 - s), n);
  o.position.set(0, -0.6, (ki + 10 + s) / 2);
  let a = new Te(new Wt(16, 1.2, r - (us - 10)), n);
  a.position.set(0, -0.6, (r + us - 10) / 2), i26.add(o, a), i26.userData.decks = [o, a];
  let l = new bn({ color: 2763315, metalness: 0.8, roughness: 0.4 }), c = new mt({ color: new re(1.2, 2.4, 3.4) });
  for (let u = ki + 6; u > us - 6; u -= 12) if (!(u < s + 2 && u > r - 2)) for (let f of [-1, 1]) {
    let h = new Te(new pn(0.08, 0.1, 6, 6), l);
    h.position.set(f * 7.6, 3, u), i26.add(h);
    let d = new Te(new Wt(1.2, 0.15, 0.3), c);
    d.position.set(f * 7, 6, u), i26.add(d);
  }
  for (let [u, f] of [[ki + 10, s], [r, us - 10]]) for (let h of [-1, 1]) {
    let d = new Te(new Wt(0.1, 0.1, u - f), l);
    d.position.set(h * 7.9, 1.1, (u + f) / 2), i26.add(d);
  }
  for (let u of [-350, -490]) for (let f of [-1, 1]) {
    let h = new Te(new Wt(1.6, 60, 1.6), l);
    h.position.set(f * 9.5, 30, u), i26.add(h);
    let d = new Te(new es(0.4, 8, 6), new mt({ color: new re(4, 0.3, 0.3) }));
    d.position.set(f * 9.5, 60.5, u), i26.add(d);
    let g = new ws({ color: new re(0.25, 0.3, 0.4) }), y = [];
    for (let m = -8; m <= 8; m++) m !== 0 && y.push(new C(f * 9.5, 58, u), new C(f * 8, 0.2, u + m * 7));
    i26.add(new _i(new dt().setFromPoints(y), g));
  }
  return i26.userData.gap = [s, r], i26.userData.decks = [o, a], i26;
}
function Qf(i26, e) {
  let t = new Zt(), n = 0, s = za - 40, r = [];
  r.push(i26.add([n, -2, s], [14, 80], [0, 0], 0.3, -100, 1e6, 0.1));
  for (let m = 0; m < 26; m++) {
    let p = m / 26 * Math.PI * 2 + e() * 0.2, M = 12 + e() * 26, w = 4 + e() * 8;
    r.push(i26.add([n + Math.cos(p) * M, -2, s + Math.sin(p) * M], [w, w * (3 + e() * 5)], [Math.sin(p) * 0.45 * (M / 38), -Math.cos(p) * 0.45 * (M / 38)], e() * 6, -100, 1e6, e()));
  }
  let o = new We({ uniforms: { uTime: wt.uTime, uI: { value: 1 }, uCrack: { value: 0 }, uCamPos: wt.uCamPos, uBG: wt.uBG, uRes: wt.uRes, uBGOn: wt.uBGOn }, vertexShader: "varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }", fragmentShader: `uniform float uTime, uI, uCrack, uBGOn; uniform vec3 uCamPos; uniform sampler2D uBG; uniform vec2 uRes; varying vec3 vN; varying vec3 vW;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      void main(){ vec3 v = normalize(uCamPos - vW); float fr = pow(1.-abs(dot(normalize(vN), v)), 2.);
        vec3 nn = normalize(vN);
        float veins = pow(1. - abs(sin((nn.x*6. + nn.y*4.3 + sin(nn.z*7. + uTime*1.5)*1.3)*3.)), 28.) + pow(1. - abs(sin((nn.z*5. - nn.y*6.1 + sin(nn.x*8. - uTime*1.1)*1.1)*3.)), 28.);
        vec2 suv = gl_FragCoord.xy/uRes; vec2 off = normalize(mat3(viewMatrix)*nn).xy*0.12;
        vec3 refr = vec3(texture2D(uBG, suv - off).r, texture2D(uBG, suv - off*1.2).g, texture2D(uBG, suv - off*1.4).b)*uBGOn;
        vec3 col = refr*vec3(0.4,0.7,1.2)*(1.-fr) + (vec3(0.01,0.03,0.1) + vec3(0.2,0.5,1.4)*pow(fr,2.)*1.1 + vec3(0.3,0.7,1.6)*veins*0.9)*uI;
        float cr = step(0.93 - uCrack*0.25, h21(floor(vN.xy*14.+vN.z*9.)));
        col += vec3(1.2,1.0,0.7)*cr*uCrack*0.6;
        gl_FragColor = vec4(col, 1.); }` }), a = new Te(new $s(9, 12), o);
  a.position.set(n, 95, s), t.add(a);
  let l = new Qi(new Li({ map: Ha, blending: Ft, depthWrite: false, transparent: true, color: new re(0.4, 0.8, 2) }));
  l.scale.setScalar(45), l.position.copy(a.position), t.add(l);
  let c = new Zn(i26.geo, i26.mesh.material, 40), u = new Float32Array(40).fill(-100), f = new Float32Array(40).fill(1e6), h = new Float32Array(40).map(() => e()), d = i26.geo.clone();
  d.setAttribute("aBirth", new Ut(u, 1)), d.setAttribute("aDeath", new Ut(f, 1)), d.setAttribute("aSeed", new Ut(h, 1)), c.geometry = d, c.frustumCulled = false, t.add(c);
  let g = new mt({ color: new re(1.5, 3, 6), transparent: true, blending: Ft, depthWrite: false }), y = [];
  for (let m = 0; m < 6; m++) {
    let p = new Te(new pn(0.6, 0.6, 1, 8, 1, true).translate(0, 0.5, 0), g.clone());
    p.visible = false, t.add(p), y.push(p);
  }
  return t.userData = { core: a, coreMat: o, halo: l, ring: c, ringDeath: f, beams: y, ids: r, center: new C(n, 0, s) }, t;
}
var pu = class {
  constructor(e, t = 160) {
    this.n = t;
    let n = new Float32Array(t * 4 * 3), s = new Float32Array(t * 4 * 2), r = new Float32Array(t * 4 * 4), o = [];
    for (let c = 0; c < t; c++) {
      s.set([-1, 0, 1, 0, -1, 1, 1, 1], c * 8);
      let u = c * 4;
      o.push(u, u + 1, u + 2, u + 2, u + 1, u + 3);
    }
    let a = new dt();
    a.setAttribute("position", new Je(n, 3).setUsage(Kc)), a.setAttribute("aUv", new Je(s, 2)), a.setAttribute("aCol", new Je(r, 4).setUsage(Kc)), a.setIndex(o);
    let l = new We({ transparent: true, depthWrite: false, blending: Ft, side: Jt, uniforms: { uCam: wt.uCamPos }, vertexShader: `attribute vec2 aUv; attribute vec4 aCol; varying vec2 vUv; varying vec4 vCol; varying vec3 vW;
        void main(){ vUv = aUv; vCol = aCol; vW = position; gl_Position = projectionMatrix*viewMatrix*vec4(position,1.); }`, fragmentShader: `uniform vec3 uCam; varying vec2 vUv; varying vec4 vCol; varying vec3 vW;
        void main(){ float d = abs(vUv.x); float core = exp(-d*d*60.); float glow = exp(-d*d*5.)*0.35;
          float near = smoothstep(1.0, 6.0, distance(vW, uCam));
          float ends = smoothstep(0., 0.015, vUv.y)*smoothstep(1., 0.97, vUv.y);
          vec3 c = mix(vCol.rgb, vec3(1.0)*max(max(vCol.r,vCol.g),vCol.b), core*0.6);
          gl_FragColor = vec4(c*(core*2.0 + glow)*vCol.a*ends*near, 1.); }` });
    this.mesh = new Te(a, l), this.mesh.frustumCulled = false, this.mesh.renderOrder = 5, e.add(this.mesh), this.k = 0, this.cam = null;
  }
  begin(e) {
    this.k = 0, this.cam = e;
  }
  add(e, t, n, s = 0.15, r = 1) {
    if (this.k >= this.n || r <= 1e-3) return;
    let o = this.k++, a = new C().subVectors(t, e), l = new C().addVectors(e, t).multiplyScalar(0.5), c = new C().subVectors(this.cam.position, l), u = new C().crossVectors(a, c).normalize().multiplyScalar(s);
    this.mesh.geometry.attributes.position.array.set([e.x - u.x, e.y - u.y, e.z - u.z, e.x + u.x, e.y + u.y, e.z + u.z, t.x - u.x, t.y - u.y, t.z - u.z, t.x + u.x, t.y + u.y, t.z + u.z], o * 12);
    let h = this.mesh.geometry.attributes.aCol.array;
    for (let d = 0; d < 4; d++) h.set([n[0], n[1], n[2], r], o * 16 + d * 4);
  }
  end() {
    let e = this.mesh.geometry.attributes.position.array;
    for (let t = this.k; t < this.n; t++) e.fill(0, t * 12, t * 12 + 12);
    this.mesh.geometry.attributes.position.needsUpdate = true, this.mesh.geometry.attributes.aCol.needsUpdate = true, this.mesh.visible = this.k > 0;
  }
}, mu = class {
  constructor(e, t = 80) {
    this.items = [];
    for (let n = 0; n < t; n++) {
      let s = new Qi(new Li({ map: Ha, blending: Ft, depthWrite: false, transparent: true }));
      s.visible = false, s.renderOrder = 6, e.add(s), this.items.push(s);
    }
    this.k = 0;
  }
  begin(e) {
    this.k = 0, this.cam = e;
  }
  add(e, t, n) {
    if (this.k >= this.items.length) return;
    let s = this.cam ? this.cam.position.distanceTo(e) : 100, r = Math.min(1, Math.max(0, (s - t * 0.3) / (t * 1.5 + 2)));
    if (r <= 0.01) return;
    let o = this.items[this.k++];
    o.visible = true, o.position.copy(e), o.scale.setScalar(t), o.material.color.setRGB(n[0] * r, n[1] * r, n[2] * r);
  }
  end() {
    for (let e = this.k; e < this.items.length; e++) this.items[e].visible = false;
  }
};
function $m(i26, e = 40) {
  let t = i26.length * e, n = new Float32Array(t * 6), s = new Float32Array(t * 6), r = new Float32Array(t * 2), o = new Float32Array(t * 6), a = new Float32Array(t * 2), l = Vn(4242), c = 0;
  for (let d of i26) for (let g = 0; g < e; g++) {
    let y = l() * Math.PI * 2, m = Math.acos(1 - 2 * l()), p = (d.speed || 12) * (0.3 + l() * 0.9), M = [Math.sin(m) * Math.cos(y) * p, Math.abs(Math.cos(m)) * p * (d.up ?? 0.8) + 2, Math.sin(m) * Math.sin(y) * p], w = d.t + l() * 0.05, _ = d.color || [2.5, 1.6, 0.8];
    for (let b = 0; b < 2; b++) n.set(d.p, (c * 2 + b) * 3), s.set(M, (c * 2 + b) * 3), r[c * 2 + b] = w, o.set(_, (c * 2 + b) * 3), a[c * 2 + b] = b;
    c++;
  }
  let u = new dt();
  u.setAttribute("position", new Je(n, 3)), u.setAttribute("aV", new Je(s, 3)), u.setAttribute("aB", new Je(r, 1)), u.setAttribute("aC", new Je(o, 3)), u.setAttribute("aE", new Je(a, 1));
  let f = new We({ transparent: true, depthWrite: false, blending: Ft, uniforms: { uTime: wt.uTime }, vertexShader: `attribute vec3 aV; attribute float aB; attribute vec3 aC; attribute float aE; uniform float uTime; varying vec3 vC;
      void main(){ float age = uTime - aB; float life = 1.1;
        if (age < 0. || age > life) { gl_Position = vec4(2.,2.,2.,1.); vC = vec3(0.); return; }
        vec3 g = vec3(0., -14., 0.);
        vec3 p = position + aV*age + 0.5*g*age*age;
        vec3 vel = aV + g*age;
        p -= vel*0.035*aE;
        vC = aC*exp(-age*3.)*(1.-aE*0.7);
        gl_Position = projectionMatrix*viewMatrix*vec4(p,1.); }`, fragmentShader: "varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.); }" }), h = new _i(u, f);
  return h.frustumCulled = false, h;
}
function jm(i26) {
  let e = 0;
  for (let h of i26) e += h.n;
  let t = new js(1, 0).toNonIndexed();
  t.computeVertexNormals();
  let n = new Float32Array(e * 3), s = new Float32Array(e * 3), r = new Float32Array(e), o = new Float32Array(e * 4), a = Vn(777), l = 0;
  for (let h of i26) for (let d = 0; d < h.n; d++) {
    let g = h.spread || [1, 1, 1];
    n.set([h.p[0] + (a() - 0.5) * g[0], h.p[1] + a() * g[1], h.p[2] + (a() - 0.5) * g[2]], l * 3);
    let y = a() * Math.PI * 2, m = (h.speed || 8) * (0.3 + a());
    s.set([Math.cos(y) * m, (h.up ?? 0.6) * m * (0.4 + a()) + 1, Math.sin(y) * m], l * 3), r[l] = h.t + a() * (h.jitter || 0.08), o.set([a() * 20 - 10, a() * 20 - 10, a() * 20 - 10, (h.size || 0.3) * (0.3 + a())], l * 4), l++;
  }
  let c = new ua();
  c.index = null, c.setAttribute("position", t.attributes.position), c.setAttribute("normal", t.attributes.normal), c.setAttribute("aO", new Ut(n, 3)), c.setAttribute("aV", new Ut(s, 3)), c.setAttribute("aB", new Ut(r, 1)), c.setAttribute("aS", new Ut(o, 4)), c.instanceCount = e;
  let u = new We({ uniforms: { uTime: wt.uTime, uCamPos: wt.uCamPos, uDawn: wt.uDawn }, vertexShader: `attribute vec3 aO; attribute vec3 aV; attribute float aB; attribute vec4 aS; uniform float uTime; varying vec3 vN; varying vec3 vW; varying float vA; varying float vSeed;
      mat3 rotm(vec3 a){ float cx=cos(a.x), sx=sin(a.x), cy=cos(a.y), sy=sin(a.y), cz=cos(a.z), sz=sin(a.z);
        return mat3(cy*cz, cy*sz, -sy, sx*sy*cz-cx*sz, sx*sy*sz+cx*cz, sx*cy, cx*sy*cz+sx*sz, cx*sy*sz-sx*cz, cx*cy); }
      void main(){ float age = uTime - aB;
        if (age < 0. || age > 3.2) { gl_Position = vec4(2.,2.,2.,1.); return; }
        mat3 R = rotm(aS.xyz*age*0.4 + aS.xyz);
        vec3 p = aO + aV*age + vec3(0., -9.8*0.5*age*age, 0.);
        if (p.y < 0.05) p.y = 0.05;
        float sc = aS.w * (1. - smoothstep(2.2, 3.2, age));
        vec3 w = p + R*(position*sc*vec3(1., 0.25, 0.8));
        vN = R*normal; vW = w; vA = age; vSeed = aS.x;
        gl_Position = projectionMatrix*viewMatrix*vec4(w,1.); }`, fragmentShader: `uniform vec3 uCamPos; uniform float uTime, uDawn; varying vec3 vN; varying vec3 vW; varying float vA; varying float vSeed;
      void main(){ vec3 n = normalize(vN); vec3 v = normalize(uCamPos - vW); float fr = pow(1.-abs(dot(n,v)), 2.);
        vec3 r = reflect(-v, n);
        vec3 env = mix(vec3(0.05,0.1,0.25), vec3(0.6,0.85,1.4), smoothstep(-0.2, 0.8, r.y));
        env = mix(env, vec3(1.4,0.9,0.6)*smoothstep(-0.2,0.8,r.y), uDawn);
        float glint = pow(max(dot(r, normalize(vec3(0.3,0.8,-0.4))), 0.), 60.)*6.;
        vec3 disp = vec3(0.5+0.5*sin(vSeed*3.+fr*9.), 0.5+0.5*sin(vSeed*3.+fr*9.+2.), 0.5+0.5*sin(vSeed*3.+fr*9.+4.));
        vec3 col = vec3(0.04,0.1,0.22) + env*fr*1.4 + disp*fr*0.6 + vec3(glint);
        gl_FragColor = vec4(col, 1.); }` }), f = new Te(c, u);
  return f.frustumCulled = false, f;
}
function Qm(i26 = 2500) {
  let t = new Float32Array(i26 * 3), n = new Float32Array(i26), s = Vn(55);
  for (let l = 0; l < i26; l++) t.set([(s() - 0.5) * 2 * 22, 0, (s() - 0.5) * 2 * 22], l * 3), n[l] = s();
  let r = new dt();
  r.setAttribute("position", new Je(t, 3)), r.setAttribute("aSeed", new Je(n, 1));
  let o = new We({ transparent: true, depthWrite: false, blending: Ft, uniforms: { uTime: wt.uTime, uCamPos: wt.uCamPos, uAmt: { value: 0 }, uGroundY: { value: 0 } }, vertexShader: `attribute float aSeed; uniform float uTime, uGroundY; uniform vec3 uCamPos; varying float vPh; varying float vA;
      void main(){ vec3 p = position; float R = 22.;
        float per = 0.45 + aSeed*0.6; float cyc = floor((uTime + aSeed*7.)/per); float ph = fract((uTime + aSeed*7.)/per);
        vec2 jit = vec2(fract(sin(cyc*12.9+aSeed*78.)*4375.), fract(sin(cyc*39.3+aSeed*11.)*9137.)) - 0.5;
        p.xz += jit*6.;
        p.xz = mod(p.xz - uCamPos.xz + R, 2.*R) - R;
        vec3 w = vec3(uCamPos.x + p.x, uGroundY + 0.02, uCamPos.z + p.z);
        vec4 mv = viewMatrix*vec4(w,1.);
        gl_Position = projectionMatrix*mv;
        vPh = ph; vA = (1. - smoothstep(8., 21., length(p.xz)))*step(ph, 0.25);
        gl_PointSize = clamp(90./max(-mv.z, 0.5) * (0.3 + ph*2.5), 1., 26.); }`, fragmentShader: `uniform float uAmt; varying float vPh; varying float vA;
      void main(){ vec2 c = gl_PointCoord - 0.5; c.y *= 2.6; float d = length(c)*2.;
        float ring = exp(-pow((d - vPh*3.6)*7., 2.));
        gl_FragColor = vec4(vec3(0.55,0.7,0.95)*ring*vA*uAmt*(1.-vPh*3.5), 1.); }` }), a = new Di(r, o);
  return a.frustumCulled = false, a;
}
function e0(i26) {
  let e = [], t = [];
  for (let o of i26) {
    let a = Vn(o.seed || 1), l = (u, f, h, d) => {
      if (h === 0) {
        e.push(...u, ...f), t.push(o.t, o.t);
        return;
      }
      let g = [(u[0] + f[0]) / 2 + (a() - 0.5) * d, (u[1] + f[1]) / 2 + (a() - 0.5) * d * 0.3, (u[2] + f[2]) / 2 + (a() - 0.5) * d];
      if (l(u, g, h - 1, d * 0.55), l(g, f, h - 1, d * 0.55), h > 3 && a() < 0.45) {
        let y = [g[0] + (a() - 0.5) * d * 2, g[1] - d * (0.5 + a()), g[2] + (a() - 0.5) * d * 2];
        l(g, y, h - 2, d * 0.4);
      }
    }, c = Math.hypot(o.to[0] - o.from[0], o.to[1] - o.from[1], o.to[2] - o.from[2]);
    l(o.from, o.to, 7, c * 0.25);
  }
  let n = new dt();
  n.setAttribute("position", new Je(new Float32Array(e), 3)), n.setAttribute("aB", new Je(new Float32Array(t), 1));
  let s = new We({ transparent: true, depthWrite: false, blending: Ft, uniforms: { uTime: wt.uTime }, vertexShader: `attribute float aB; uniform float uTime; varying float vI;
      void main(){ float age = uTime - aB; float f = age < 0. || age > 0.45 ? 0. : (step(age,0.07) + step(0.13,age)*step(age,0.2) + step(0.28,age)*step(age,0.34)*0.6);
        vI = f; gl_Position = projectionMatrix*viewMatrix*vec4(position,1.); }`, fragmentShader: "varying float vI; void main(){ gl_FragColor = vec4(vec3(1.6,2.0,3.2)*vI, 1.); }" }), r = new _i(n, s);
  return r.frustumCulled = false, r.userData.events = i26, r;
}
function t0(i26, e) {
  let t = 0;
  for (let n of i26) {
    let s = e - n.t;
    s >= 0 && s < 0.45 && (t += (s < 0.07 ? 1 : s > 0.13 && s < 0.2 ? 0.8 : s > 0.28 && s < 0.34 ? 0.5 : 0.1) * (n.flash ?? 1));
  }
  return t;
}

const Pt = wt, Za = Vn, id = new URLSearchParams();
const Tn = 240 / 138, cS = Tn / 4, uS = 0.024, i0 = 1 / 24, X = t => uS + t * Tn;
const lt = new Zr(); lt.name = 'ZA_NAS_FILM'; lt.fog = new Zo(0, 0.004);
const Ye = new Kt(45, 1280 / 536, 0.03, 6000);
const envTargets = [];
const hS = new po(renderer);
function p0(i26) {
  let e = new Zr();
  e.background = new re(i26 ? 9071200 : 328714);
  let t = (n, s, r) => {
    let o = new Te(new Wt(1, 1, 1), new mt({ color: n }));
    o.position.set(...s), o.scale.set(...r), e.add(o);
  };
  return i26 ? (t(new re(2.2, 1.3, 0.8), [0, 3, -8], [6, 3, 0.3]), t(new re(0.4, 0.5, 0.8), [0, 9, 0], [10, 0.3, 10])) : (t(new re(4, 0.3, 0.8), [-6, 1, -3], [0.3, 4, 3]), t(new re(0.5, 1.6, 4), [6, 2, 2], [0.3, 3, 4]), t(new re(3, 0.6, 2.5), [0, 5, -6], [8, 0.3, 0.3]), t(new re(0.3, 0.6, 1.8), [0, 8, 0], [6, 0.2, 6]), t(new re(2.5, 1.4, 0.4), [-3, 0.5, 6], [3, 1, 0.3])), (() => { const target = hS.fromScene(e, 0.03); envTargets.push(target); e.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); }); return target.texture; })();
}
var m0 = p0(false), fS = p0(true);
lt.environment = m0;

hS.dispose();

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
var yu = timeline, un = yu.events, Io = (i26) => {
  let e = Math.floor(i26 * yu.fps);
  return yu.wobble[Math.max(0, Math.min(yu.wobble.length - 1, e))] || 0;
};
function Nn(i26, e, t, n = 1.2) {
  let s = 0;
  for (let r of i26) {
    let o = e - r;
    if (o >= 0 && o < n && (s += Math.exp(-o / t)), r > e) break;
  }
  return s;
}
function xu(i26, e) {
  let t = [], n = e * 4, s = 0;
  for (; s < n - 1e-6; ) {
    let r = s / n;
    t.push(X(i26) + s * cS), s += r < 0.25 ? 1 : r < 0.5 ? 0.5 : r < 0.8 ? 0.25 : 0.125;
  }
  return t;
}
var sd = [...xu(24, 4), ...xu(64, 4), ...xu(72, 4), ...xu(96, 4)], Va = Wf();
lt.add(Va);
var qa = Xf();
lt.add(qa);
var rd = qf();
lt.add(rd);
var od = Yf();
lt.add(od);
var ud = jf();
lt.add(ud);
var bo = $f();
lt.add(bo);
var Ga = Kf(7e3);
lt.add(Ga);
var ur = Zf();
lt.add(ur);
var Mu = Qm();
lt.add(Mu);
var td = new pu(lt, 180), nd = new mu(lt, 90), fr = du(), dr = du();
lt.add(fr, dr);
var dS = [...qa.userData.grounds, ...ud.userData.decks, bo.userData.floor], So = [[0, -60, X(28) + 0.3, 30, 200], [0, -640, X(28), 25, 115], [0, -300, X(52) + 0.8, 8.8, 250], [-190, 40, X(31), 40, 230]];
Pt.uEpi.value.forEach((i26, e) => i26.set(So[e][0], So[e][1], So[e][2], So[e][3]));
Pt.uEpiR.value = So.map((i26) => i26[4]);
function Cu(i26, e) {
  let t = 1e6;
  for (let [n, s, r, o, a] of So) {
    let l = Math.hypot(i26 - n, e - s);
    l < a && (t = Math.min(t, r + l / o));
  }
  return t;
}
var Vt = new C(0, 0, -603), Iu = X(100) + 0.35, Ya = [Vt.x, Vt.z], g0 = 140;
Pt.uShatterT0.value = Iu;
Pt.uShatterO.value.set(...Ya);
Pt.uShatterSpeed.value = g0;
var vr = (i26, e) => Iu + Math.hypot(i26 - Ya[0], e - Ya[1]) / g0, hn = new Ba(9e3);
lt.add(hn.mesh);
var _t = Za(1234);
for (let i26 = 150; i26 > -290; i26 -= 2.2) for (let e = 0; e < 2; e++) {
  let t = (_t() - 0.5) * 30;
  Math.abs(t) < 2.6 && (t += Math.sign(t || 1) * 3);
  let n = Cu(t, i26);
  n > 1e5 || hn.cluster(_t, [t, 0, i26], 2 + (_t() * 3 | 0), 0.35 + Math.pow(_t(), 2) * (Math.abs(t) > 8 ? 2.2 : 1.2), n + _t() * 0.3, 1.2, vr(t, i26));
}
for (let i26 of qa.userData.boxes) {
  let e = Cu(i26.x, i26.z);
  if (e > 1e5 || _t() < 0.35) continue;
  let t = 1 + (_t() * 3 | 0);
  for (let n = 0; n < t; n++) {
    let s = i26.x + (_t() - 0.5) * i26.w * 0.8, r = i26.z + (_t() - 0.5) * i26.d * 0.8;
    hn.cluster(_t, [s, i26.h, r], 3, 1.5 + _t() * 3.5, e + i26.h * 0.02 + _t() * 0.5, 1.2, vr(s, r));
  }
}
var x0 = X(41) + 0.05, Eo = -124;
for (let i26 = -13; i26 <= 13; i26 += 0.9) {
  let e = 1.2 + _t() * 1.4;
  hn.add([i26, -0.3, Eo + (_t() - 0.5) * 1.4], [e, e * (2.2 + _t() * 2.5)], [(_t() - 0.5) * 0.4, (_t() - 0.5) * 0.4], _t() * 6, x0 + Math.abs(i26) * 0.035 + _t() * 0.1, vr(i26, Eo) + 0.6, _t());
}
for (let i26 = -298; i26 > -545; i26 -= 1.6) if (!(i26 < -464 && i26 > -476)) for (let e = 0; e < 2; e++) {
  let t = (_t() - 0.5) * 15;
  Math.abs(t) < 2.2 && (t += Math.sign(t || 1) * 2.5);
  let n = Cu(t, i26);
  n > 1e5 || hn.cluster(_t, [t, 0, i26], 2, 0.5 + _t() * 1.4, n, 1.2, vr(t, i26));
}
for (let i26 = 0; i26 < 260; i26++) {
  let e = _t() * Math.PI * 2, t = 30 + Math.sqrt(_t()) * 90, n = Math.cos(e) * t, s = za + Math.sin(e) * t;
  Math.abs(n) < 6 && s > -650 || hn.cluster(_t, [n, 0, s], 3, 0.8 + _t() * 3.5, Cu(n, s) + _t() * 0.3, 1.5, vr(n, s));
}
var mr = Qf(hn, _t);
lt.add(mr);
for (let i26 of mr.userData.ids) {
  let e = hn.pos.find((t) => t.i === i26);
  hn.birth[i26] = X(28) + 0.2 + _t() * 0.5, hn.death[i26] = vr(e.p[0], e.p[2]) + 0.25, e.birth = hn.birth[i26], e.death = hn.death[i26];
}
mr.userData.ringDeath.fill(Iu + 0.2);
mr.userData.ring.geometry.attributes.aDeath.needsUpdate = true;
hn.finalize();
var v0 = Jf(hn, 4);
lt.add(v0);
var gn = new C(0, 95, -680), zt = gn.clone().add(new C(0, -2, 11.5)), Vi = [];
{
  let i26 = Za(77), e = un.snare.filter((n) => n >= X(28) - 0.01 && n < X(44)), t = un.kick.filter((n) => n >= X(28) - 0.01 && n < X(31));
  for (let n of [...e, ...t]) Vi.push({ t: n, end: [(i26() - 0.5) * 90, 0, 60 - i26() * 260], size: 2 + i26() * 4, tilt: [(i26() - 0.5) * 0.6, (i26() - 0.5) * 0.6], yaw: i26() * 6 });
  Vi.push({ t: X(41), end: [0.5, 0, Eo], size: 4.5, tilt: [0.25, -0.1], yaw: 1 }), Vi.push({ t: X(38) + 0.1, end: [3, 0, -103], size: 3.5, tilt: [-0.3, 0.2], yaw: 2 });
}
var Pu = hu(), Us = new Zn(Pu, hn.mesh.material, Vi.length);
Pu.setAttribute("aBirth", new Ut(new Float32Array(Vi.length).fill(-100), 1));
Pu.setAttribute("aDeath", new Ut(new Float32Array(Vi.map((i26) => vr(i26.end[0], i26.end[2]))), 1));
Pu.setAttribute("aSeed", new Ut(new Float32Array(Vi.map((i26, e) => e * 0.37 % 1)), 1));
Us.frustumCulled = false;
lt.add(Us);
var Lu = new C(0.05, 0.5, -1).normalize(), pS = new C().crossVectors(Lu, new C(0, 1, 0)).normalize(), To = (i26) => Lu.clone().multiplyScalar(1400).addScaledVector(pS, i26 * 900), vu = new Oe(), s0 = new vt(), r0 = new rn();
function mS(i26) {
  Vi.forEach((e, t) => {
    let s = i26 - (e.t - 0.9);
    if (s < 0) {
      vu.makeScale(0, 0, 0), Us.setMatrixAt(t, vu);
      return;
    }
    let r = Math.min(1, s / 0.9), o = new C(...e.end).addScaledVector(Lu, 420).lerp(new C(...e.end), r * r);
    o.y -= e.size * 0.6 * Math.min(1, r), r0.set(e.tilt[0] * r + (1 - r) * 1.2, e.yaw, e.tilt[1] * r), s0.setFromEuler(r0), vu.compose(o, s0, new C(e.size * 0.8, e.size * 2.4, e.size * 0.8)), Us.setMatrixAt(t, vu);
  }), Us.instanceMatrix.needsUpdate = true;
}
var _0 = (i26, e) => {
  let t = Za(Math.floor(i26 * 1e3) + e * 77);
  return new C((t() - 0.5) * 60, 0, -600 + (t() - 0.5) * 60);
}, Du = (i26) => -300 - 9.5 * (i26 - X(52)), y0 = (i26, e) => {
  let t = Za(Math.floor(i26 * 1e3) + e);
  return new C((t() - 0.5) * 12, 0, Du(i26) + 10 + t() * 14);
}, M0 = un.snare.filter((i26) => i26 > X(78) && i26 < X(90)), S0 = un.snare.filter((i26) => i26 > X(52) && i26 < X(64)), _r = [], Wi = [], hd = [], fd = [];
for (let i26 of Vi) _r.push({ t: i26.t, p: [i26.end[0], 1, i26.end[2]], color: [1.2, 2.2, 3.5], speed: 22 }), Wi.push({ t: i26.t, p: [i26.end[0], 0.5, i26.end[2]], n: 45, size: 0.5, speed: 12, spread: [3, 2, 3] });
for (let i26 of M0) for (let e = 0; e < 4; e++) {
  let t = _0(i26, e);
  _r.push({ t: i26, p: [t.x, 0.3, t.z], color: [3, 2, 1], speed: 16 }), Wi.push({ t: i26, p: [t.x, 0.2, t.z], n: 14, size: 0.35, speed: 9 });
}
for (let i26 of S0) for (let e = 0; e < 3; e++) {
  let t = y0(i26, e);
  _r.push({ t: i26, p: [t.x, 0.2, t.z], color: [3, 1, 1.4], speed: 14 });
}
for (let i26 of un.snare.filter((e) => e > X(77) && e < X(90))) _r.push({ t: i26, p: zt.clone().add(new C(0, 0.8, -1.8)).toArray(), color: [3, 2.6, 2], speed: 14, up: 0.3 }), Wi.push({ t: i26, p: zt.clone().add(new C(0, 0.5, -2.2)).toArray(), n: 22, size: 0.35, speed: 10, up: 0.2 }), hd.push({ t: i26, p: zt.clone().add(new C(0, 0.8, -1.8)), s: 0.5 });
var fs = fu;
for (let i26 = 0; i26 < 12; i26++) _r.push({ t: X(27.5) + i26 * 0.02, p: [fs.x + [-9, -5, 5, 9, -16.9, 16.9][i26 % 6], 6 + i26 % 3, fs.z - 12.5 + (i26 > 5 ? 10 : 0)], color: [3, 0.6, 1], speed: 8 });
Wi.push({ t: X(26.5), p: [fs.x + 8.8, 1.2, fs.z + 5.8], n: 30, size: 0.05, speed: 2.5, up: 1 });
Wi.push({ t: X(26.5), p: [fs.x + 9.3, 1.2, fs.z + 5.9], n: 30, size: 0.05, speed: 2.5, up: 1 });
Wi.push({ t: x0, p: [0, 0.5, Eo], n: 120, size: 0.25, speed: 8, spread: [26, 2, 2] });
Wi.push({ t: X(62) - 0.2, p: [0, 0.5, Du(X(62)) + 12], n: 90, size: 0.3, speed: 9, spread: [12, 1, 6] });
Wi.push({ t: X(89), p: zt.clone().add(new C(0, 0, -3)).toArray(), n: 220, size: 0.8, speed: 26, up: 0.2, spread: [8, 8, 4] });
_r.push({ t: X(89), p: zt.toArray(), color: [3, 2.8, 2.4], speed: 30, up: 0.3 });
for (let i26 of hn.pos) i26.death > 1e5 || Math.hypot(i26.p[0] - Ya[0], i26.p[2] - Ya[1]) > 260 && _t() < 0.8 || Wi.push({ t: i26.death - 0.05, p: [i26.p[0], i26.p[1] + i26.scale[1], i26.p[2]], n: i26.scale[0] > 3 ? 10 : 2, size: Math.min(1.5, i26.scale[0] * 0.35), speed: 6 + i26.scale[0], jitter: 0.1 });
var ad = jm(Wi);
lt.add(ad);
var b0 = $m(_r, 36);
lt.add(b0);
{
  let i26 = Za(31), e = [X(0) + 0.1, X(4), X(8), X(10.5), X(11.5), X(11.8), ...un.kick.filter((t) => t > X(28) && t < X(44)).filter((t, n) => n % 2 === 0), ...un.impact.filter((t) => t > X(70) && t < X(92)), X(96), X(98), X(99.5)];
  for (let t of e) {
    let n = (i26() - 0.5) * 500, s = -100 - i26() * 700;
    fd.push({ t, from: [n + (i26() - 0.5) * 200, 700 + i26() * 200, s - 400], to: [n, 60 + i26() * 60, s], seed: Math.floor(i26() * 1e6), flash: 0.6 });
  }
}
var E0 = e0(fd);
lt.add(E0);
hd.push({ t: X(28), p: null, s: 1 }, { t: X(76), p: null, s: 1 }, { t: X(100), p: null, s: 1.2 }, { t: X(77), p: zt, s: 1 }, { t: X(89), p: zt, s: 1.2 });
var gS = [{ t: X(28), text: "\u0417\u0410 \u041D\u0410\u0421", big: 1 }, { t: X(76), text: "\u0417\u0410 \u041D\u0410\u0421", big: 1 }, { t: X(100), text: "\u0417\u0410 \u041D\u0410\u0421", big: 1 }, ...[32, 36, 40, 80, 84, 88, 104, 108].map((i26, e) => ({ t: X(i26), text: e % 2 ? "\u041D\u0410\u0421" : "\u0417\u0410", big: 0 }))], xS = [X(28), X(76), X(89), X(100)], Eu = new Te(new pn(3, 5, 1400, 24, 1, true).translate(0, 700, 0), new We({ transparent: true, depthWrite: false, blending: Ft, side: Jt, uniforms: { uI: { value: 0 }, uTime: Pt.uTime }, vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }", fragmentShader: "uniform float uI, uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float e = pow(abs(dot(vN,vV)), 1.5); float s = 0.7+0.3*sin(vUv.y*80.-uTime*20.); gl_FragColor = vec4(vec3(2.4,2.0,1.4)*e*s*uI*(1.-vUv.y*0.6), 1.); }" }));
Eu.position.copy(Vt);
lt.add(Eu);
var Mo = new Te(new pn(0.05, 0.35, 1, 10, 1, true).translate(0, -0.5, 0), new mt({ color: new re(1, 2.2, 4), transparent: true, blending: Ft, depthWrite: false }));
lt.add(Mo);
var Su = new tr(4214912, 4198432, 0.8);
lt.add(Su);
var dd = new Cs(8952319, 1.2);
dd.position.set(-50, 80, 40);
lt.add(dd);
var Tu = new Cs(16724838, 2.5);
Tu.position.set(30, 20, -60);
lt.add(Tu);
var bu = new ii(8961023, 20, 25, 1.5);
lt.add(bu);
var ld = new ii(11193599, 0, 80, 1.2);
lt.add(ld);
var vS = await Xm(), { kai: fe, mira: ze, nana: De } = vS;
for (let i26 of [fe, ze, De]) lt.add(i26.holder);
qm(De, 0);
var L = (i26, e, t) => new C(i26, e, t), xn = (i26, e = 0, t = 1) => Math.max(e, Math.min(t, i26)), ke = (i26, e, t) => i26 + (e - i26) * t, He = (i26) => (i26 = xn(i26), i26 * i26 * (3 - 2 * i26)), Un = (i26) => (i26 = xn(i26), i26 < 0.5 ? 4 * i26 * i26 * i26 : 1 - Math.pow(-2 * i26 + 2, 3) / 2), Ka = (i26) => 1 - Math.pow(1 - xn(i26), 3), o0 = (i26) => Math.pow(xn(i26), 3), Gi = (i26, e, t) => i26.clone().lerp(e, t);
function ps(i26, e) {
  i26 = xn(i26);
  for (let t = 1; t < e.length; t++) {
    let [n, s] = e[t - 1], [r, o] = e[t];
    if (i26 <= r) {
      let a = (i26 - n) / (r - n);
      return ke(s, o, He(a) * 0.5 + a * 0.5);
    }
  }
  return e[e.length - 1][1];
}
var a0 = /* @__PURE__ */ new Map();
function gr(i26, e) {
  let t = i26.map((s) => s.toArray().join(",")).join("|"), n = a0.get(t);
  return n || (n = new sa(i26, false, "centripetal"), a0.set(t, n)), n.getPoint(xn(e));
}
var pr = (i26, e) => Math.atan2(i26, e), pd = 0, md = 45;
function Ge(i26, e, t = 45, n = 0) {
  Ye.position.copy(i26), Ye.up.set(0, 1, 0), Ye.lookAt(e), md = t, pd = n;
}
function Ja(i26, e, t, n, s = i26, r = 40, o = 0) {
  Ge(L(i26.x + Math.sin(t) * e, i26.y + n, i26.z + Math.cos(t) * e), s, r, o);
}
function we(i26, e, t, n) {
  i26.holder.visible = true, i26.holder.position.copy(e), i26.holder.quaternion.setFromEuler(new rn(0, t, 0)), i26.pivot.position.y = i26.baseY, Oa(i26, n);
}
var Fn = (i26, e, t = 1) => ({ Run: [cr(i26, "Run", e * t), 1] }), gd = (i26, e, t = 1) => ({ Walk: [cr(i26, "Walk", e * t), 1] }), Yt = (i26, e) => ({ Idle: [cr(i26, "Idle", e), 1] }), yt = (i26, e, t = true) => ({ [i26]: [t ? cr(De, i26, e) : e, 1] }), wo = (i26) => {
  let e = new C();
  return (i26.bones.mixamorigHead || i26.bones.Head).getWorldPosition(e), e;
};
function ui(i26) {
  let e = i26.holder.quaternion;
  return { fwd: L(0, 0, 1).applyQuaternion(e), right: L(-1, 0, 0).applyQuaternion(e), up: L(0, 1, 0) };
}
function l0(i26, e, t) {
  let { right: n } = ui(i26);
  if (rt(i26, "mixamorigRightArm", n, 70 * e), rt(i26, "mixamorigRightForeArm", n, 55 * e), i26.holder.updateMatrixWorld(true), t) {
    let s = new C();
    i26.bones.mixamorigRightHand.getWorldPosition(s), t.visible = true, t.position.copy(s).add(L(0, 0.05, 0));
  }
}
function c0(i26, e) {
  let { right: t, up: n } = ui(i26);
  rt(i26, "mixamorigRightArm", t, 70 * e), rt(i26, "mixamorigRightArm", n, 35 * e), rt(i26, "mixamorigLeftArm", t, 70 * e), rt(i26, "mixamorigLeftArm", n, -35 * e), rt(i26, "mixamorigRightForeArm", n, 70 * e), rt(i26, "mixamorigLeftForeArm", n, -70 * e), rt(i26, "mixamorigHead", t, -12 * e);
}
function xd(i26, e) {
  let { right: t, up: n } = ui(i26);
  rt(i26, "mixamorigRightArm", t, 62 * e), rt(i26, "mixamorigRightArm", n, 22 * e), rt(i26, "mixamorigLeftArm", t, 62 * e), rt(i26, "mixamorigLeftArm", n, -22 * e), rt(i26, "mixamorigRightForeArm", n, 45 * e), rt(i26, "mixamorigLeftForeArm", n, -45 * e), rt(i26, "mixamorigRightForeArm", t, 20 * e), rt(i26, "mixamorigLeftForeArm", t, 20 * e);
}
function wu(i26, e, t = "Right", n = 95) {
  let { right: s } = ui(i26);
  rt(i26, `mixamorig${t}Arm`, s, n * e);
}
function T0(i26, e) {
  let { right: t } = ui(i26);
  i26.pivot.position.y = i26.baseY - 0.52 * e, rt(i26, "mixamorigRightUpLeg", t, 85 * e), rt(i26, "mixamorigRightLeg", t, -85 * e), rt(i26, "mixamorigLeftUpLeg", t, 5 * e), rt(i26, "mixamorigLeftLeg", t, -95 * e), rt(i26, "mixamorigSpine", t, -14 * e);
}
function xr(i26, e) {
  let { right: t } = ui(i26);
  rt(i26, "mixamorigHead", t, 28 * e), rt(i26, "mixamorigNeck", t, 12 * e);
}
function w0(i26, e) {
  let { right: t } = ui(i26);
  rt(i26, "mixamorigHead", t, -30 * e), rt(i26, "mixamorigNeck", t, -12 * e);
}
function A0(i26, e) {
  let { right: t, up: n } = ui(i26);
  rt(i26, "mixamorigRightArm", t, 80 * e), rt(i26, "mixamorigRightArm", n, 15 * e), rt(i26, "mixamorigRightForeArm", t, 15 * e);
}
function R0(i26, e, t, n) {
  let { fwd: s, right: r } = ui(i26), o = i26.holder.position.clone().addScaledVector(s, 0.42).add(L(0, ke(1.05, 0.6, e), 0)), a = new vt().setFromEuler(new rn(0, Math.atan2(s.x, s.z) + Math.PI, 0)), l = L(0, 1, 0), c = r.clone().negate(), u = new C().crossVectors(c, l), f = new vt().setFromRotationMatrix(new Oe().makeBasis(u, c, l)), h = a.clone().slerp(f, t), d = L(0, 1, 0).applyQuaternion(h).multiplyScalar(-0.45);
  De.holder.visible = true, De.pivot.position.y = De.baseY, De.holder.position.copy(o).add(d.multiplyScalar(t)), De.holder.quaternion.copy(h), Oa(De, yt("Idle", n));
  let g = ui(De);
  rt(De, "Head", g.right, 25 * t), rt(De, "UpperArmL", g.fwd, -40 * t), rt(De, "UpperArmR", g.fwd, 40 * t);
}
var li = (i26) => -6.2 * (i26 - X(30)), vd = L(-0.6, 0, -566);
function qt(i26) {
  return Object.assign({ city: true, club: false, bridge: true, roof: true, spire: true, rain: 0.8, motes: 0, ember: 0.5, fogC: 722448, fog: 45e-4, dawn: 0, rift: 0, riftW: 0, cryst: 0.3, bloom: 0.85, bloomR: 0.5, bloomT: 0.82, sat: 1.08, tint: [1, 1, 1], vig: 0.95, grain: 0.03, win: 1, hemi: 0.8, moon: 1.2, rim: 2.5, key: 20, gold: 0, rise: 0, sky: true, wet: 1, refl: 1, splash: 0.9, lens: 0, streak: 0.4, rays: 0, contrast: 1.06 }, i26);
}
var Au = [], Ru = [], _S = [], hr = null, ci = null, Xn = (i26, e, t, n = 0.12, s = 1) => Au.push([i26, e, t, n, s]), ds = (i26, e, t) => Ru.push([i26, e, t]);
var Ao = (i26, e) => {
  hr = { text: i26, who: e };
};
function yr(i26, e = 1) {
  for (let t of Vi) {
    let n = i26 - (t.t - 1.1);
    if (n < 0 || n > 1.35) continue;
    let s = n < 1.1 ? He(n / 0.2) : Math.exp(-(n - 1.1) / 0.08), r = To(t.end[0] * 13.7 % 1 - 0.5);
    Xn(r, L(t.end[0] + Math.sin(n * 9) * 2, 0, t.end[2]), [0.4, 1, 3], 1.2, s * e), ds(L(t.end[0], 0.5, t.end[2]), 6 * s, [0.2 * s, 0.5 * s, 1.2 * s]);
  }
  for (let t = 0; t < 8; t++) {
    let n = To((t / 7 - 0.5) * 0.9), s = Math.sin(i26 * (0.5 + t * 0.13) + t * 2) * 160, r = -120 + Math.cos(i26 * (0.4 + t * 0.11) + t) * 180;
    Xn(n, L(s, 0, r), t % 2 ? [3, 0.3, 0.8] : [0.4, 1.2, 3], 1.6, 0.45 * e);
  }
}
function Nu(i26, e = L(0, 0, -100), t = 1, n = 6) {
  for (let s = 0; s < n; s++) {
    let r = e.clone().add(L(Math.cos(s * 2.1) * 90, 40 + s % 3 * 20, Math.sin(s * 1.7) * 120)), o = L(Math.sin(i26 * 0.4 + s * 1.3) * 0.6, 1, Math.cos(i26 * 0.33 + s) * 0.5).normalize();
    Xn(r, r.clone().addScaledVector(o, 600), [0.6, 0.8, 1.4], 3.5, 0.25 * t);
  }
}
function Uu(i26, e, t = 0) {
  let n = Nn(un.kick, i26, 0.12, 0.6);
  [ht(-8, 9.1, -6), ht(8, 9.1, -6), ht(0, 9.1, -10), ht(-4, 9.1, 4), ht(4, 9.1, 4)].forEach((r, o) => {
    let a = [[3, 0.2, 0.6], [0.3, 1.5, 3.5], [2.6, 0.3, 2.6], [0.4, 3, 1.2]], l = t > 0.5 ? [3.5, 0.2, 0.3] : a[(o + Math.floor(i26 / Tn)) % 4];
    for (let c = 0; c < 7; c++) {
      let u = (c - 3) * 0.16 + Math.sin(i26 * (1.2 + o * 0.3) + o) * 0.5, f = Math.sin(i26 * 0.9 + o * 1.7) * 0.4 + 0.25, h = L(Math.sin(u), -Math.cos(u) * (0.6 + f), Math.cos(u * 0.7 + o) * 0.6).normalize();
      (c % 2 === 0 || e > 1) && Xn(r, r.clone().addScaledVector(h, 24), l, 0.03, e * 0.45 * (0.6 + 0.7 * n));
    }
    ds(r, 1.2, [l[0] * 0.5, l[1] * 0.5, l[2] * 0.5]);
  });
}
function $a(i26, e = 1, t = null) {
  let n = Io(i26);
  for (let s = 0; s < 14; s++) {
    let r = s / 14 * Math.PI * 2 + i26 * 0.7, o = 70 + 50 * Math.sin(i26 * 0.9 + s), a = L(Math.cos(r) * o, 0, -620 + Math.sin(r) * o * 0.8), l = a.clone().sub(gn).normalize();
    Xn(gn.clone().addScaledVector(l, 9.5), a, s % 3 === 0 ? [3, 0.4, 1.2] : [0.5, 1.4, 3.2], 0.45, (0.2 + n * 0.5) * e), ds(a.clone().setY(0.5), 6, [0.3, 0.7, 1.6]);
  }
  for (let s of M0) {
    let r = i26 - s;
    if (r < -0.25 || r > 0.35) continue;
    let o = r < 0 ? He((r + 0.25) / 0.25) * 0.5 : Math.exp(-r / 0.12) * 1.6;
    for (let a = 0; a < 4; a++) {
      let l = _0(s, a), c = l.clone().sub(gn).normalize();
      Xn(gn.clone().addScaledVector(c, 9.5), l, [1.6, 2.4, 4], 0.8, o * e * 0.7), ds(l.clone().setY(0.8), 7 * o, [1 * o, 1.2 * o, 1.6 * o]);
    }
  }
}
var C0 = [], tt = (i26, e, t, n) => C0.push({ b0: i26, b1: e, t0: X(i26), t1: X(e), tr: t, fn: n }), yS = 42.15, Wa = L(20, yS, -9.8), ht = (i26, e, t) => L(fs.x + i26, fs.y + e, fs.z + t), MS = [L(60, 330, 520), L(30, 190, 320), L(10, 70, 170), L(0, 11, 95), L(2, 4.5, 45), L(-1, 4.5, 5), L(3, 9, -12), L(8, 28, -6), L(12, 46, -2), L(18, 44.8, -1.2)], SS = [L(0, 40, 0), L(0, 20, -40), L(0, 8, -40), L(0, 5, 20), L(0, 5, -20), L(0, 6, -40), L(8, 30, -30), L(16, 44, -12), L(19, 43.8, -10), L(20, 43.7, -9.8)];
tt(0, 8, "cut", ({ t: i26, u: e }) => {
  let t = ps(e, [[0, 0], [0.34, 0.24], [0.5, 0.42], [0.72, 0.66], [0.8, 0.72], [1, 1]]), n = gr(MS, t), s = gr(SS, t);
  we(ze, Wa, Math.PI, Yt(ze, i26)), Ge(n, s, ke(55, 62, He((e - 0.4) * 4)) - 8 * He((e - 0.85) * 6), Math.sin(t * 7) * 0.08 * He(e * 3)), Nu(i26, L(0, 0, -150), 1 - He((e - 0.6) * 3));
  for (let o = 0; o < 6; o++) {
    let a = 70 - o * 16, l = 9 + o % 3 * 4, c = Math.sin(i26 * 2 + o) * 3;
    Xn(L(-12, l + c, a), L(12, l - c, a - 4), o % 2 ? [3.5, 0.2, 0.5] : [0.3, 1.2, 3.5], 0.05, 0.9 * He((e - 0.3) * 5));
  }
  let r = He((e - 0.42) * 8) * (1 - He((e - 0.8) * 8));
  return qt({ rift: 0.12 + 0.1 * e, riftW: 0.1, fog: 32e-4, fade: 1 - He(i26 / 2.2), lens: r * 0.8, splash: r, flares: true });
});
tt(8, 10, "cut", ({ t: i26, u: e, lt: t }) => {
  we(ze, Wa, Math.PI, Yt(ze, t + 3));
  let n = ke(0, Math.PI * 0.95, Un(e)), s = ke(8.3, 2.6, Ka(e)), r = ke(2.65, 1.55, e);
  return Ja(Wa, s, n, r, Wa.clone().add(L(0, 1.45, 0)), ke(52, 36, e)), Nu(i26, L(0, 0, -150), 0.6), qt({ rift: 0.25, riftW: 0.15, key: 30, splash: 0.6 });
});
tt(10, 12, "cut", ({ t: i26, u: e, lt: t }) => {
  we(ze, Wa, Math.PI, Yt(ze, t + 5));
  let n = He((e - 0.3) * 2.5);
  xr(ze, n);
  let s = wo(ze), r = Un(xn((e - 0.42) / 0.5)), o = ke(ke(1.6, 0.8, Ka(e * 2)), 1.4, r), a = ke(Math.PI - 0.25, 0.35, r), l = ke(-0.02, 0.35, r), c = s.clone().add(L(Math.sin(a) * Math.cos(l) * o, Math.sin(l) * o, Math.cos(a) * Math.cos(l) * o)), f = s.clone().sub(c).normalize().clone().lerp(Lu, He((r - 0.35) / 0.65)).normalize();
  Ge(c, c.clone().addScaledVector(f, 10), ke(32, 55, r), 0);
  let h = ke(0.3, 1.4, Ka(r));
  if (r > 0.3) for (let d = 0; d < 5; d++) Xn(To((d / 4 - 0.5) * 0.6), L((d - 2) * 60, 0, -300), [0.4, 1.2, 3], 1.5, r * 0.8);
  return qt({ rift: h, riftW: ke(0.15, 0.7, r), key: 12, lens: 0.5, bloom: 1, flashB: Math.max(0, (e - 0.9) * 8) * 0.7, fade: He((e - 0.93) * 14), zoomPunch: He((e - 0.85) * 6), flares: true });
});
tt(12, 14, "fade", ({ t: i26, u: e }) => {
  Ge(L(0, 5, 0), L(0, 5, -10), 50);
  for (let t = 0; t < 6; t++) {
    let n = 5 + (t - 2.5) * 0.9 + Math.sin(i26 * 2 + t) * 0.1, s = ke(-60, 60, xn(e * 1.6 - t * 0.08));
    Xn(L(-40, n, -30), L(s, n, -30), t % 2 ? [3, 0.3, 0.8] : [0.4, 1.3, 3.2], 0.05, He(e * 4) * (1 - He((e - 0.85) * 7)));
  }
  return ci = { a: He(e * 3) * (1 - He((e - 0.82) * 6)), main: "\u0417\u0410 \u041D\u0410\u0421", sub: "\u2014 \u4FFA\u305F\u3061\u306B \u2014", glitch: e < 0.15 || e > 0.5 && e < 0.53 }, qt({ city: false, bridge: false, roof: false, spire: false, sky: false, rain: 0, motes: 1, ember: 0.3, gold: 0.4, fog: 0, crystalsOff: true, bloom: 1.2, wet: 0, refl: 0, splash: 0, streak: 0.8, glitch: e < 0.12 ? 0.5 : 0 });
});
var I0 = ht(-1, 0, -3), P0 = ht(1.3, 0, -2.3), L0 = ht(9, 0, 4.6);
function Fu(i26, e = 0, t = 1) {
  let n = Nn(un.kick, i26, 0.12, 0.6);
  bo.userData.neonMat.color.setRGB(4 * (0.75 + 0.25 * n) * t, 0.35 * t, 0.6 * t), bo.userData.neonB.color.setRGB(0.6 * t, 1.6 * t, 4 * t), bo.userData.cones.forEach((s, r) => {
    s.rotation.z = Math.sin(i26 * 0.6 + r) * 0.35, s.rotation.x = Math.cos(i26 * 0.5 + r * 2) * 0.25, s.material.uniforms.uI.value = (0.8 + 0.4 * n) * t, s.material.uniforms.uCol.value.setRGB(ke(0.35, 1, e), ke(0.55, 0.1, e), ke(1, 0.2, e));
  });
}
var Ou = (i26) => qt(Object.assign({ city: false, bridge: false, roof: false, spire: false, sky: false, rain: 0, fog: 0.018, fogC: 1049867, club: true, bloom: 0.85, bloomT: 0.85, crystalsOff: true, key: 0, hemi: 0.35, moon: 0, rim: 0, splash: 0, wet: 0.85, streak: 0.45 }, i26)), bS = [ht(-4, 0.6, 1.5), ht(-3.5, 1.4, -0.2), ht(-1.2, 1.6, 0.4), ht(1.2, 0.8, -0.2), ht(3.5, 1.3, 1.5), ht(6.5, 1.7, 2.6), ht(7.6, 1.65, 3.2)], ES = [ht(-1, 1.2, -3), ht(-1, 1.3, -3), ht(-0.5, 1.1, -3), ht(1.3, 0.6, -2.3), ht(4, 1.2, 1), ht(9, 1.6, 4.6), ht(9, 1.65, 4.6)];
tt(14, 20, "fade", ({ t: i26, u: e, lt: t }) => {
  Fu(i26), we(ze, I0, 0.4, { Samba: [cr(ze, "Samba", t + 1), 1] }), we(De, P0, -0.5, yt("Dance", t)), we(fe, L0, Math.PI + 0.5, Yt(fe, t));
  let n = ps(e, [[0, 0], [0.3, 0.3], [0.45, 0.42], [0.55, 0.62], [0.75, 0.8], [1, 1]]);
  Ge(gr(bS, n), gr(ES, n), ke(40, 30, He((e - 0.7) * 3)), Math.sin(e * 5) * 0.04), Uu(i26, 1);
  let s = i26 > X(16) ? Nn(un.kick, i26, 0.05, 0.3) * 0.25 : 0;
  return Ou({ flashW: s });
});
tt(20, 22, "cut", ({ t: i26, u: e, lt: t }) => {
  Fu(i26), we(ze, I0, 0.4, { Samba: [cr(ze, "Samba", t + 12), 1] }), we(De, P0, -0.5, yt("Dance", t + 7));
  let n = L0, s = ht(3.2, 0, 0.2), r = Gi(n, s, e);
  we(fe, r, pr(s.x - n.x, s.z - n.z), gd(fe, t));
  let o = wo(fe);
  return Ge(r.clone().add(L(ke(-1.4, -2.4, e), 1.45, ke(1.6, 2.8, e))), r.clone().add(L(-0.3, 1.3, -0.5)), 36), Uu(i26, 1), Ou({ flashW: Nn(un.kick, i26, 0.05, 0.3) * 0.2 });
});
var Ei = ht(1.1, 0, -1.2), Ti = ht(-0.3, 0, -2.2), D0 = ht(0.9, 0, -2.6);
tt(22, 24, "cut", ({ t: i26, u: e, lt: t }) => {
  Fu(i26), we(fe, Ei, pr(Ti.x - Ei.x, Ti.z - Ei.z), Yt(fe, t)), we(ze, Ti, pr(Ei.x - Ti.x, Ei.z - Ti.z), Yt(ze, t + 2)), we(De, D0, pr(-0.4, 1), e < 0.5 ? yt("ThumbsUp", t, false) : yt("Yes", t - Tn, false));
  let n = He(e * 2.5);
  l0(fe, n, fr), l0(ze, n * He(e * 2.5 - 0.3), dr);
  let s = Ei.clone().lerp(Ti, 0.5), r = X(23), o = Math.exp(-Math.max(0, i26 - r) / 0.2) * (i26 > r ? 1 : 0);
  if (Ge(s.clone().add(L(-1, 0, 1.4).multiplyScalar(ke(1.8, 1.25, Un(e)))).add(L(0, 1.45, 0)), s.clone().add(L(0, 1.45, 0)), 36 - o * 6), i26 > r && i26 < r + 0.6) {
    let a = fr.position.clone().lerp(dr.position, 0.5);
    ds(a, 0.8 * o + 0.2, [2.5 * o, 2 * o, 1.2 * o]);
  }
  return Uu(i26, 0.8), e > 0.12 && e < 0.5 ? Ao("\u0417\u0430 \u043D\u0430\u0441.", "\u30AB\u30A4") : e >= 0.55 && e < 0.95 && Ao("\u2026\u2026\u4FFA\u305F\u3061\u306B\u3002", "\u30DF\u30E9"), Ou({ hemi: 0.4, flashW: o * 0.25 });
});
tt(24, 28, "cut", ({ t: i26, u: e, lt: t }) => {
  let n = e, s = Math.sin(i26 * 40) > 0.3 - n ? 1 : 0.25;
  Fu(i26, He(e * 2), i26 > X(27.5) ? 0 : s), we(fe, Ei, pr(Ti.x - Ei.x, Ti.z - Ei.z) - 0.6 * He(e * 3), Yt(fe, t)), we(ze, Ti, pr(Ei.x - Ti.x, Ei.z - Ti.z), Yt(ze, t + 2)), we(De, D0, pr(-0.4, 1), yt("No", t)), xr(fe, He(e * 3)), xr(ze, He(e * 3 - 0.2));
  let r = Nn(sd.filter((u) => u < X(28)), i26, 0.06, 0.3), o = Un(e), a = gr([ht(-5, 0.7, 5), ht(-3, 1.2, 2.5), ht(-1.4, 1.5, 0.2), ht(0.2, 1.55, -0.6)], o), l = gr([ht(0, 2.5, -3), ht(0.3, 2, -2), ht(0.5, 1.6, -1.6), ht(0.8, 1.55, -1.5)], o);
  Ge(a, l, 40 - r * 4 - o * 8, Math.sin(i26 * 3) * 0.05 * n), i26 < X(27.5) && Uu(i26, 0.6 + e, He(e * 2)), i26 > X(26.3) && i26 < X(27.5) && (fr.visible = dr.visible = true, fr.position.copy(ht(8.8, 1.2, 5.8)), dr.position.copy(ht(9.3, 1.2, 5.9)), i26 > X(26.5) && (fr.visible = dr.visible = false));
  let c = i26 > X(27.5) ? 1 : 0;
  return Ou({ hemi: 0.35, shake: 0.02 + n * n * 0.3, dust: n, fade: c * 0.97, flashW: i26 > X(27.4) && i26 < X(27.5) ? 1.3 : Nn(sd.filter((u) => u < X(28)), i26, 0.04, 0.2) * 0.12 * e, glitch: r * 0.25 * e });
});
function vn(i26, e = {}) {
  let t = Io(i26);
  return qt(Object.assign({ rift: 1.2, riftW: 1, cryst: 0.3 + t * 1.1, fog: 4e-3, rain: 0.6, motes: 0.5, ember: 0.55, bloom: 0.85, drop: true, streak: 0.35, flares: true }, e));
}
tt(28, 29, "cut", ({ t: i26, u: e }) => (Ge(L(-3 + e * 1.5, 1.4, 70 + e * 7), L(0, 45, -60), 60, 0.05), yr(i26), vn(i26, { lens: 0.4 })));
tt(29, 30, "whip", ({ t: i26, u: e }) => (Ge(L(8 - e * 6, 70 - e * 12, 150 - e * 25), L(0, 25, -150), 52, -0.06), yr(i26), vn(i26)));
tt(30, 32, "whip", ({ t: i26, u: e, lt: t }) => {
  let n = li(i26);
  return we(fe, L(-1.1, 0, n), Math.PI, Fn(fe, t)), we(ze, L(1.2, 0, n + 0.8), Math.PI, Fn(ze, t + 0.2)), we(De, L(0.1, 0, n - 0.6), Math.PI, yt("Running", t * 1.2)), Ge(L(0.5 + Math.sin(e * 3) * 0.6, 0.8, n - 6.5 + e * 1.5), L(0, 1.1, n + 2), 42), yr(i26), vn(i26, { key: 30, lens: 0.5 });
});
tt(32, 34, "zoom", ({ t: i26, u: e, lt: t }) => {
  let n = ps(e, [[0, 0], [0.2, 0.35], [0.75, 0.62], [1, 1]]), s = X(32) + t * 0.3, r = li(s);
  return we(fe, L(-1.1, 0, r), Math.PI, Fn(fe, t * 0.3)), we(ze, L(1.2, 0, r + 0.8), Math.PI, Fn(ze, t * 0.3 + 0.2)), we(De, L(0.1, 0, r - 0.6), Math.PI, yt("Running", t * 0.36)), Ja(L(-0.2, 0, r), 3.6, Math.PI + n * Math.PI * 2, 1.3, L(-0.3, 1.1, r), 40), yr(s), vn(i26, { worldT: s, key: 30, rainSlow: 0.12 });
});
tt(34, 36, "whip", ({ t: i26, u: e, lt: t }) => {
  let n = li(i26);
  return we(fe, L(-1.1, 0, n), Math.PI, Fn(fe, t)), we(ze, L(1.2, 0, n + 0.8), Math.PI, Fn(ze, t + 0.2)), we(De, L(0.1, 0, n - 0.6), Math.PI, yt("Running", t * 1.2)), Ye.position.set(0, ke(55, 28, Un(e)), n + 6), Ye.up.set(0, 0, -1), Ye.lookAt(L(0, 0, n - 4)), md = 50, pd = e * 0.8, yr(i26), vn(i26, { key: 40, keyUp: true });
});
tt(36, 40, "whip", ({ t: i26, u: e, lt: t }) => {
  let n = li(i26);
  we(fe, L(-1.1, 0, n), Math.PI, Fn(fe, t)), we(ze, L(1.2, 0, n + 0.8), Math.PI, Fn(ze, t + 0.2));
  let s = i26 > X(38) && i26 < X(38) + 1.2;
  we(De, L(0.1, 0, n - 0.6), Math.PI, s ? yt("WalkJump", (i26 - X(38)) * 1.3, false) : yt("Running", t * 1.2));
  let r = Math.floor(e * 4), o = e * 4 % 1;
  return r % 2 === 0 ? Ge(L(-6.5 + o, 1.2 + o * 0.3, n - 1 - o * 2), L(-0.5, 1.1, n - 1.5), 36, 0.03) : Ge(L(4 + o, 0.5, n - 9 + o), L(0, 1.4, n), 44, -0.04), yr(i26), vn(i26, { key: 35, lens: 0.3, whipBars: true });
});
tt(40, 44, "whip", ({ t: i26, u: e, lt: t }) => {
  let n = Math.max(li(i26), -129), s = Math.max(li(i26) + 0.8, -119.5), r = li(i26) < -129, o = li(i26) + 0.8 < -119.5, a = He((i26 - X(41.6)) / 0.8);
  if (we(fe, L(-1.1, 0, n), Math.PI - Math.PI * a * (r ? 1 : 0), r ? Yt(fe, t) : Fn(fe, t)), we(ze, L(0.6, 0, s), Math.PI, o ? Yt(ze, t) : Fn(ze, t + 0.2)), we(De, L(-0.3, 0, Math.max(li(i26) - 0.6, -131.5)), Math.PI - Math.PI * a, li(i26) - 0.6 < -131.5 ? yt("Idle", t) : yt("Running", t * 1.2)), i26 > X(42) && A0(ze, He((i26 - X(42)) / 1)), i26 > X(42.5) && wu(fe, He((i26 - X(42.5)) / 1.2) * 0.7), i26 < X(41)) Ge(L(-9, 2.2, li(i26) - 6), L(0, 1.5, li(i26) - 2), 40);
  else if (i26 < X(42)) {
    let l = (i26 - X(41)) / Tn;
    Ge(L(9 - l * 2, 0.4 + l * 2, Eo - 1), L(0, 3 + l * 2, Eo), 46, 0.05);
  } else if (i26 < X(43)) {
    let l = (i26 - X(42)) / Tn;
    Ge(L(-0.9 + l * 0.4, 1.55, -129.5 + l * 1.5), L(0.5, 1.5, -119.5), 34);
  } else {
    let l = wo(fe);
    Ge(l.clone().add(L(0.9, -0.05, -1.2)), l.clone().add(L(0, -0.1, 2)), 32);
  }
  return yr(i26, 0.8), vn(i26, { key: 30, lens: 0.3 });
});
tt(44, 48, "fade", ({ t: i26, u: e, lt: t }) => {
  let n = -131 - 1.3 * t;
  return we(fe, L(-0.8, 0, n), Math.PI, gd(fe, t)), we(De, L(0.4, 0, n - 0.4), Math.PI, yt("Walking", t)), Ge(gr([L(-3, 9, n + 9), L(-2.5, 4, n + 2), L(-1.2, 1.2, n - 4)], Un(e)), L(-0.2, 1.1, n), 40), Nu(i26, L(0, 0, -300), 0.5, 4), qt({ rift: 0.9, riftW: 0.9, cryst: 0.45, fog: 7e-3, fogC: 658456, rain: 0.35, motes: 1.2, ember: 0.45, key: 25, bloom: 0.95, sat: 0.85, lens: 0.6, flares: true, rainSlow: 0.5 });
});
tt(48, 50, "cut", ({ t: i26, u: e, lt: t }) => {
  we(ze, L(0.6, 0, -119.5), Math.PI, Yt(ze, t + 3)), A0(ze, 1);
  let n = wo(ze);
  return Ge(n.clone().add(L(-0.9 + e * 0.4, 0, -1)), n.clone().add(L(0, -0.05, 0)), 30), qt({ rift: 0.9, riftW: 0.9, cryst: 0.5, fog: 7e-3, fogC: 658456, rain: 0.35, motes: 0.8, key: 18, bloom: 1, sat: 0.85, lens: 0.7 });
});
tt(50, 52, "cut", ({ t: i26, u: e, lt: t }) => {
  let n = L(-0.8, 0, -140), s = L(0.3, 0, -140.6);
  return we(fe, n, Math.PI, e > 0.5 ? { agree: [(e - 0.5) * 2 * Tn, 1] } : Yt(fe, t)), we(De, s, Math.PI - 0.1, { Punch: [Math.min(0.42, e * 2), 1] }), Ge(L(2.2 - e * 0.6, 1.3, -143.6), L(-0.2, 1.1, -140.3), 36), qt({ rift: 0.9, riftW: 0.9, cryst: 0.5, fog: 4e-3, fogC: 658456, rain: 0.35, motes: 0.8, key: 18, bloom: 1, lens: 0.4 });
});
function Bu(i26, e, t = null) {
  let n = Du(i26);
  return we(fe, L(-1.2, t ? t.y : 0, n), Math.PI, Fn(fe, e, 1.35)), we(De, L(0.9, t ? t.y : 0, n + 0.5), Math.PI, t && t.air ? yt("WalkJump", 0.45, false) : yt("Running", e * 1.5)), n;
}
function zu(i26) {
  for (let e of S0) {
    let t = i26 - e;
    if (t < -0.3 || t > 0.3) continue;
    let n = t < 0 ? He((t + 0.3) / 0.3) * 0.6 : Math.exp(-t / 0.1) * 1.5;
    for (let s = 0; s < 3; s++) {
      let r = y0(e, s);
      Xn(To(s * 0.2 - 0.2), r, [3, 0.4, 1], 1, n), ds(r.clone().setY(0.6), 6 * n, [1.6 * n, 0.4 * n, 0.7 * n]);
    }
  }
  for (let e = 0; e < 4; e++) {
    let t = Du(i26) + 25 + Math.sin(i26 * 1.3 + e) * 15;
    Xn(To(e * 0.3 - 0.45), L(Math.sin(i26 * 2 + e * 2) * 8, 0, t), [0.4, 1.2, 3], 0.7, 0.5);
  }
}
tt(52, 56, "whip", ({ t: i26, u: e, lt: t }) => {
  let n = Bu(i26, t), s = ps(e, [[0, 0], [0.4, 0.3], [0.6, 0.65], [1, 1]]);
  return Ge(L(1.5 - s * 3, 1 + s * 2.5, n - 7 - s * 2), L(0, 1.2, n + 6), 44 + 6 * Math.sin(e * Math.PI), 0.03), zu(i26), vn(i26, { cryst: 0.6, rain: 0.6, key: 35, lens: 0.5 });
});
tt(56, 58, "whip", ({ t: i26, u: e, lt: t }) => {
  let n = Bu(i26, t);
  return Ge(L(10.5, 2.2, n - 1 - e * 2), L(0, 1.2, n - 1.5), 34), zu(i26), vn(i26, { cryst: 0.6, rain: 0.6, key: 35 });
});
tt(58, 60, "whip", ({ t: i26, u: e, lt: t }) => {
  let n = Bu(i26, t);
  return Ge(L(-40 + e * 10, 26 - e * 6, n + 25 - e * 10), L(0, 0, n - 10), 42), zu(i26), vn(i26, { cryst: 0.6, rain: 0.6, key: 35 });
});
tt(60, 64, "zoom", ({ t: i26, u: e, lt: t }) => {
  let n = X(62) - 0.35, s = 0.25, r = i26, o = false, a = 0;
  if (i26 > n) {
    let f = i26 - n, h = 1.6;
    r = f < h ? n + f * s : n + h * s + (f - h);
  }
  let l = r - n, c = 1;
  l > 0 && l < c && (o = true, a = 4 * 1.6 * (l / c) * (1 - l / c));
  let u = Bu(r, r - X(60), { y: a, air: o });
  if (i26 < n) Ge(L(2.5, 0.35, u - 8), L(0, 1.4, u), 40);
  else if (i26 < X(62) + 1.6) {
    let f = (i26 - n) / 1.95;
    Ge(L(9 - f * 3, 1 + f, -468 - f * 2), L(0, 1.8, u), 42 - f * 6, 0.06);
  } else Ge(L(-3, 1.2, u - 6), L(0, 1.2, u + 3), 42);
  return zu(r), vn(i26, { cryst: 0.6, rain: 0.6, key: 35, worldT: r, rainSlow: r !== i26 ? 0.25 : 1, lens: 0.3 });
});
tt(64, 68, "fade", ({ t: i26, u: e, lt: t }) => {
  let n = L(-0.6, 0, -560 - 1.3 * t), s = n.clone().add(L(1.1, 0, -0.3));
  we(fe, n, Math.PI, gd(fe, t)), we(De, s, Math.PI, yt("Walking", t));
  let r = ps(e, [[0, 0], [0.6, 0.35], [1, 1]]);
  return Ge(Gi(n.clone().add(L(0.8, 1.3, 2.2)), n.clone().add(L(2.5, 2.8, 5.5)), r), Gi(n.clone().add(L(0, 1.4, -4)), gn, Un(r)), ke(40, 58, r)), Nu(i26, L(0, 0, -680), 1, 8), qt({ rift: 1, riftW: 1, cryst: 0.6, fog: 25e-4, fogC: 526870, rain: 0.3, motes: 0.6, key: 25, coreI: 1 + Nn(un.kick, i26, 0.15), lens: 0.3, flares: true, rays: 0.3, raysAt: gn });
});
tt(68, 72, "cut", ({ t: i26, u: e, lt: t }) => {
  let n = Nn(un.kick, i26, 0.18, 0.8);
  if (i26 < X(70)) {
    we(fe, vd, Math.PI, Yt(fe, t)), xr(fe, 0.8);
    let r = wo(fe);
    return Ge(r.clone().add(L(0.4, 0.05, -1.1 + e * 0.3)), r.clone(), 30 - n * 2), qt({ rift: 1, riftW: 1, cryst: 0.8, fog: 25e-4, fogC: 526870, rain: 0.25, key: 5, keyPulse: n, coreI: 1 + n * 2, lens: 0.5 });
  }
  we(ze, L(0.6, 0, -119.5), Math.PI, Yt(ze, t)), xr(ze, 0.4);
  let s = wo(ze);
  return Ge(s.clone().add(L(0.7, 0.05, -1.3 + (e - 0.5) * 0.4)), s.clone().add(L(0, -0.05, 0)), 30 - n * 2), qt({ rift: 1, riftW: 1, cryst: 0.8, fog: 22e-4, fogC: 526870, rain: 0.3, key: 12, keyPulse: n, keyCol: [0.4, 0.7, 1.2], coreI: 1 + n * 2, lens: 0.5 });
});
tt(72, 76, "glitch", ({ t: i26, u: e, lt: t }) => {
  let n = L(0.8, 0, -567.5);
  we(fe, vd, Math.PI, Yt(fe, t));
  let s = Nn(sd.filter((o) => o > X(72) && o < X(76)), i26, 0.05, 0.25);
  if (i26 < X(74)) return we(De, n, Math.PI - 2.6, yt("ThumbsUp", (i26 - X(72)) * 0.9, false)), Ge(n.clone().add(L(-1.6, 0.8, -1.2)), n.clone().add(L(0, 0.75, 0)), 34 - s * 3), qt({ rift: 1, riftW: 1, cryst: 1, fog: 25e-4, fogC: 526870, rain: 0.2, key: 25, coreI: 1.5 + e * 2, shake: 0.2 * e });
  if (i26 < X(75.5)) {
    let o = (i26 - X(74)) / (1.5 * Tn);
    return we(De, n.clone().add(L(0, 0, -o * 3)), Math.PI, yt("Walking", t)), wu(fe, He(o * 1.5) * 0.8), Ge(Gi(L(-1.5, 2, -560), L(-0.5, 40, -620), o0(o)), gn, ke(40, 75, o0(o)) - s * 5), $a(i26, o * 0.6), qt({ rift: 1, riftW: 1, cryst: 1.4, fog: 25e-4, fogC: 526870, rain: 0.2, key: 25, coreI: 2 + o * 3, shake: 0.3 + o * 0.5, glitch: s * 0.3, rays: 0.5 * o, raysAt: gn, flares: true });
  }
  we(De, n.clone().add(L(0, 0, -4.5)), Math.PI + 0.3, yt("Idle", t));
  let r = new C();
  return De.bones.Head.getWorldPosition(r), Ge(r.clone().add(L(-0.15, 0.1, -0.9).applyAxisAngle(L(0, 1, 0), 0.3)), r.clone().add(L(0, 0.12, 0)), 28), qt({ blackout: true, rift: 0, cryst: 0, fog: 0.05, fogC: 0, rain: 0, key: 0, hemi: 0.02, moon: 0, rim: 0.3, eyeI: 1.1, sky: false, wet: 0, splash: 0, streak: 1.2 });
});
tt(76, 78, "flash", ({ t: i26, u: e, lt: t }) => {
  let n = xn((i26 - X(76)) / Tn), s = L(0.8, 0, -571.5), r = new C().lerpVectors(s, zt, Un(n));
  return r.y = ke(0, zt.y, 1 - Math.pow(1 - n, 2.2)), we(De, r, Math.PI, n < 1 ? yt("Jump", 0.35 + n * 0.3, false) : yt("Punch", (i26 - X(77)) * 1.2)), we(fe, vd, Math.PI, Yt(fe, t)), xr(fe, 1), i26 < X(77) ? Ge(L(-2, 0.4, -562), r.clone().add(L(0, 0.5, 0)), 58, 0.08) : Ge(zt.clone().add(L(-9, 4, 14)), gn.clone().add(L(0, 0, 3)), 44, -0.05), $a(i26, 1), vn(i26, { bloom: 0.75, cryst: 0.5 + Io(i26) * 1.3, coreI: 1.2, fog: 18e-4, fogC: 526870, trail: n < 1 ? { from: s, to: r } : null, key: 20, keyAt: r, rays: 0.4, raysAt: gn });
});
tt(78, 82, "whip", ({ t: i26, u: e, lt: t }) => {
  we(De, zt, Math.PI, yt("Punch", t * 1.3));
  let n = (i26 - X(78)) / Tn, s = Math.floor(n) + ps(n % 1, [[0, 0], [0.15, 0.05], [1, 1]]);
  return Ja(zt, 7.5, ke(-1.1, 1.1, s / 4), 1.5, zt.clone().add(L(0, 0.6, -4)), 46), $a(i26, 1), vn(i26, { bloom: 0.75, cryst: 0.5 + Io(i26) * 1.3, coreI: 1.4, fog: 15e-4, fogC: 526870, key: 30, keyAt: zt, rays: 0.35, raysAt: gn });
});
tt(82, 86, "whip", ({ t: i26, u: e, lt: t }) => {
  let n = -566 - 6 * t, s = L(-0.6 + Math.sin(t * 2) * 1.2, 0, n);
  we(fe, s, Math.PI, Fn(fe, t));
  let r = Math.floor(e * 4), o = e * 4 % 1;
  return r % 2 === 0 ? Ge(L(1.5, 0.6, n - 6 + o), L(-0.5, 1.8, n), 42, 0.04) : Ge(L(-7 + o * 2, 3, n + 3), L(0, 2, n - 3), 38, -0.03), $a(i26, 1, s), vn(i26, { bloom: 0.75, cryst: 0.5 + Io(i26) * 1.3, coreI: 1.4, fog: 18e-4, fogC: 526870, key: 30, whipBars: true, lens: 0.3 });
});
tt(86, 90, "zoom", ({ t: i26, u: e, lt: t }) => {
  let n = He(e * 1.2), s = i26 > X(88) && i26 < X(89), r = s ? (X(88) - X(86)) * 1.3 + (i26 - X(88)) * 0.25 : t * 1.3;
  we(De, zt, Math.PI, yt("Punch", r)), i26 < X(88) ? Ja(zt, 6, -0.8 + e * 0.8, -0.5, gn, 50) : i26 < X(89) ? Ge(zt.clone().add(L(2.6, 1.5, 2.6)), zt.clone().add(L(0, 0.6, -1)), 36) : Ge(zt.clone().add(L(-12, -6, 18)), zt, 40);
  let o = i26 > X(89) ? Math.exp(-(i26 - X(89)) / 0.3) : 0;
  if (s || $a(i26, 1), i26 > X(89)) {
    let a = Math.exp(-(i26 - X(89)) / 0.5);
    Xn(gn, zt, [2.5, 2.8, 3.5], 3 * a + 0.5, 2 * a);
  }
  return vn(i26, { bloom: 0.75, cryst: 0.6 + Io(i26) * 1.4, coreI: 1.4 + n * 1.5, crack: n, fog: 15e-4, fogC: 526870, key: 30, keyAt: zt, flashW: o * 0.5, worldT: s ? X(88) + (i26 - X(88)) * 0.25 : i26, eyeI: i26 > X(89) ? Math.sin(i26 * 50) > 0 ? 1 : 0.2 : 1.5, rays: 0.4, raysAt: gn });
});
tt(90, 92, "cut", ({ t: i26, u: e, lt: t }) => {
  let n = X(91.75), s = xn((i26 - X(90)) / (n - X(90))), r = L(0, 0, -611), a = Gi(r, Vt, He(xn((i26 - X(90)) / (n - X(90) - 0.3))));
  if (we(fe, a, 0, i26 < n - 0.35 ? Fn(fe, t) : Yt(fe, t)), i26 < n) {
    wu(fe, He((i26 - (n - 1)) / 0.6), "Right", 140), wu(fe, He((i26 - (n - 1)) / 0.6), "Left", 140);
    let c = U0(0), u = L(ke(zt.x, c.x, Un(s)), ke(zt.y, c.y, 1 - Math.pow(1 - s, 1.6)), ke(zt.z, c.z, Un(s))), f = TS.clone().slerp(N0, He((s - 0.35) / 0.65));
    De.holder.visible = true, De.pivot.position.y = De.baseY, De.holder.position.copy(u), De.holder.quaternion.copy(f), Oa(De, yt("Idle", 1));
    let h = ui(De);
    rt(De, "Head", h.right, 25 * He(s)), rt(De, "UpperArmL", h.fwd, -40 * He(s)), rt(De, "UpperArmR", h.fwd, 40 * He(s)), ds(u.clone().add(L(0, 0.5, 0)), 3, [0.6, 1.2, 2.2]);
    let d = Gi(u.clone().add(L(3, 1, 7)), Vt.clone().add(L(2.2, 0.6, 3.2)), He((s - 0.6) / 0.4));
    Ge(d, Gi(u, Vt.clone().add(L(0, 1.4, 0)), He((s - 0.7) / 0.3)), 44);
  } else {
    we(fe, Vt, 0, Yt(fe, t)), xd(fe, 1), w0(fe, 0.6), R0(fe, 0, 1, 1);
    let c = (i26 - n) / (X(92) - n);
    Ge(Vt.clone().add(L(2.2 - c * 0.4, 0.6 + c * 0.4, 3.2 - c * 0.5)), Vt.clone().add(L(0, 1.3, 0)), 44);
  }
  let l = i26 > n ? Math.exp(-(i26 - n) / 0.25) : 0;
  return qt({ rift: 0.8, riftW: 1, cryst: 0.6, fog: 2e-3, fogC: 526870, rain: 0.35, motes: 0.7, coreI: 0.6, crack: 1, key: 25, keyAt: Vt.clone().add(L(0, 2, 0)), eyeI: (Math.sin(i26 * 30) > 0.4 ? 1 : 0.1) * (1 - s), sat: 0.75, flashW: l * 0.35, shake: l * 0.4, lens: 0.3 });
});
var N0 = new vt().setFromRotationMatrix(new Oe().makeBasis(L(0, 0, 1), L(1, 0, 0), L(0, 1, 0))), TS = new vt().setFromEuler(new rn(0, Math.PI, 0)), U0 = (i26) => Vt.clone().add(L(-0.45, ke(1.05, 0.6, i26), 0.42));
function ja(i26, e, t = 1) {
  we(fe, Vt, 0, { sad: [0.5, 0.6], Idle: [1, 0.4] }), T0(fe, t), xd(fe, 1), w0(fe, 0.7), R0(fe, t, 1, 1);
}
tt(92, 96, "fade", ({ t: i26, u: e, lt: t }) => {
  if (ja(i26, t), i26 < X(94)) Ge(Gi(L(-8, 3.5, -592), L(-3.2, 1.3, -598.5), Un(e * 2)), Vt.clone().add(L(0, 0.7, 0.3)), 36);
  else {
    let n = (i26 - X(94)) / (2 * Tn);
    Ge(Vt.clone().add(L(1.1, 1.35 - n * 0.1, 2.6 - n * 0.5)), Vt.clone().add(L(-0.1, 0.8, 0.3)), 34);
  }
  return i26 > X(93) && i26 < X(94.6) && Ao("\u30CA\u30CA\u2026\u2026", "\u30AB\u30A4"), i26 > X(95) && i26 < X(96) && Ao("\u304A\u3044\u2026\u2026\u8D77\u304D\u308D\u3088\u3002", "\u30AB\u30A4"), qt({ rift: 0.5, riftW: 0.7, cryst: 0.2, fog: 4e-3, fogC: 395282, rain: 1.3, motes: 0.5, ember: 0.1, coreI: 0.35, crack: 1, key: 14, keyAt: Vt.clone().add(L(1, 2.5, 1)), eyeI: 0, nanaCore: 0.05 + (Math.sin(i26 * 3) > 0.95 ? 0.3 : 0), sat: 0.6, tint: [0.85, 0.95, 1.15], bloom: 0.9, lens: 1, splash: 1.3 });
});
tt(96, 100, "cut", ({ t: i26, u: e, lt: t }) => {
  ja(i26, t);
  let s = 0.05 + (0.5 + 0.5 * Math.sin(i26 * ke(4, 40, e * e))) * e * 4 + e * e * 3, r = new C();
  De.core.getWorldPosition(r);
  let o = ps(e, [[0, 0], [0.7, 0.4], [1, 1]]), a = Vt.clone().add(L(-0.1, 0.72, 0.42));
  return Ge(a.clone().add(L(0.35, 0.9, 1.9).multiplyScalar(ke(1.1, 0.5, o))), a, ke(38, 30, o)), qt({ rift: 0.5, riftW: 0.7, cryst: 0.2, fog: 4e-3, fogC: 395282, rain: 1.1 - e * 0.6, motes: 0.5, coreI: 0.35, crack: 1, key: 10 + s * 6, keyAt: r.clone().add(L(0, 0.4, 0)), keyCol: [0.6, 0.8, 1], eyeI: 0, nanaCore: s, sat: 0.6 + e * 0.3, tint: [0.9, 0.95, 1.1], flashW: i26 > X(99.75) ? 1.5 : 0, lens: 0.8 * (1 - e), splash: 1, streak: 0.8, glitch: e > 0.8 ? (e - 0.8) * 1.5 : 0 });
});
function _d(i26) {
  return xn((i26 - X(101)) / (X(112) - X(101)));
}
function Hu(i26, e) {
  let t = Vt.clone().add(L(0, 1, 0));
  for (let n = 0; n < 24; n++) {
    let s = n / 24 * Math.PI * 2 + i26 * 0.35, r = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(i26 * 0.8 + n)), o = L(Math.cos(s) * Math.cos(r), Math.sin(r), Math.sin(s) * Math.cos(r));
    Xn(t, t.clone().addScaledVector(o, 500), [3, 2.2, 1.1], 0.5, e);
  }
}
tt(100, 102, "flash", ({ t: i26, u: e, lt: t }) => (ja(i26, t), xr(fe, 1), Ge(L(-14, 1, -590 + e * 5), L(0, 60 + e * 30, -650), 60, 0.05), Hu(i26, 0.7), vn(i26, { bloom: 0.35, bloomT: 1.3, streak: 0.15, rift: 1.2 * (1 - e), riftW: 1 - e, cryst: 0.3, dawn: _d(i26) * 0.5, pillar: 0.35, eyeI: 0, nanaCore: 5, coreI: 3, crack: 1, gold: 0.8, motes: 0.8, rise: 1, rain: 0.2, rays: 0.4, raysAt: Vt.clone().add(L(0, 40, 0)), rayCol: [1.2, 1, 0.7] })));
tt(102, 104, "whip", ({ t: i26, u: e, lt: t }) => {
  ja(i26, t);
  let n = ps(e, [[0, 0], [0.5, 0.6], [1, 1]]);
  return Ge(L(ke(-160, 60, n), ke(260, 200, n), ke(-320, -180, n)), L(0, 0, -380), 52, -0.1 + 0.2 * n), Hu(i26, 1), vn(i26, { bloom: 0.8, rift: 0.3, riftW: 0.4, cryst: 0.9, dawn: _d(i26) * 0.5, pillar: 0.3, nanaCore: 4, coreI: 3, gold: 0.9, motes: 0.8, rise: 1, rain: 0.1 });
});
tt(104, 108, "fade", ({ t: i26, u: e, lt: t }) => {
  let n = 1 - He((i26 - X(106)) / 1.2), s = xn((i26 - X(105.4)) / 0.9);
  if (s <= 0) ja(i26, t, 1);
  else {
    we(fe, Vt, 0, i26 > X(106.2) ? { agree: [(i26 - X(106.2)) % Km(fe, "agree"), 1] } : Yt(fe, t)), T0(fe, n), xd(fe, 1 - He(s * 1.5));
    let a = U0(1), l = Vt.clone().add(L(0.2, 0, 1.1)), c = Gi(a, l, Un(s));
    c.y += Math.sin(s * Math.PI) * 0.5;
    let u = N0.clone().slerp(new vt().setFromEuler(new rn(0, Math.PI * 0.95, 0)), He(s));
    De.holder.visible = true, De.pivot.position.y = De.baseY, De.holder.position.copy(c), De.holder.quaternion.copy(u), Oa(De, s < 1 ? yt("Jump", 0.3 + s * 0.7, false) : yt("Wave", (i26 - X(105.4) - 0.9) * 1.1));
  }
  let r = Vt.clone().add(L(0.1, 0.8, 0.6));
  Ge(r.clone().add(L(ke(1.2, 0.6, Un(e)), 0.2, ke(3.4, 2.5, Un(e)))), r.clone().add(L(0, 0.1, 0)), 36), i26 > X(106.3) && i26 < X(107.9) && Ao("\u2026\u2026\u304A\u304B\u3048\u308A\u3002", "\u30AB\u30A4");
  let o = 0.5 + _d(i26) * 0.3;
  return qt({ rift: 0, cryst: 0.4, dawn: o, fog: 3e-3, fogC: 9068640, rain: 0, motes: 1, gold: 1, rise: 1, eyeI: He((i26 - X(104.3)) / 0.6) * 1.6, nanaCore: 2.5, key: 20, keyAt: Vt.clone().add(L(0, 2, 1)), keyCol: [1, 0.8, 0.6], hemi: 1, moon: 0.5, rim: 3, rimCol: [1, 0.6, 0.35], sat: 1.05, win: 0.3, splash: 0, wet: 0.7, rays: 0.4, raysSun: true, flares: true });
});
var hs = L(0, 0, -420);
tt(108, 110, "whip", ({ t: i26, u: e, lt: t }) => {
  let n = -330 - 7 * t;
  return we(ze, L(0.3, 0, n), Math.PI, Fn(ze, t)), Ge(L(-0.8, 1.1, n - 5.5 + e * 1), L(0.3, 1.3, n), 38), qt({ rift: 0, cryst: 0, dawn: 0.75, fog: 25e-4, fogC: 11565672, rain: 0, motes: 0.8, gold: 1, rise: 1, key: 10, keyCol: [1, 0.8, 0.6], hemi: 1, moon: 0.4, rim: 2.6, rimCol: [1, 0.6, 0.35], win: 0.2, sat: 1.1, splash: 0, wet: 0.6, rays: 0.45, raysSun: true, flares: true });
});
tt(110, 112, "whip", ({ t: i26, u: e, lt: t }) => {
  let n = -470 + 7 * t;
  return we(fe, L(-0.3, 0, n), 0, Fn(fe, t)), we(De, L(1.2, 0, n - 1.5), 0, yt("Running", t * 1.2)), Ge(L(1.5, 0.7, n + 6), L(0, 1.6, n), 40), qt({ rift: 0, cryst: 0, dawn: 0.85, fog: 25e-4, fogC: 11565672, rain: 0, motes: 0.8, gold: 1, rise: 1, key: 10, keyCol: [1, 0.8, 0.6], hemi: 1, moon: 0.4, rim: 2.6, rimCol: [1, 0.6, 0.35], win: 0.2, sat: 1.1, splash: 0, wet: 0.6, rays: 0.45, raysSun: true, flares: true });
});
tt(112, 116, "flash", ({ t: i26, u: e, lt: t }) => {
  let n = Ka(xn(t / 0.8)), s = hs.clone().add(L(0, 0, ke(-1.2, -0.23, n))), r = hs.clone().add(L(0, 0, ke(1.2, 0.23, n)));
  we(fe, s, 0, Yt(fe, t)), we(ze, r, Math.PI, Yt(ze, t)), c0(fe, n), c0(ze, n), rt(ze, "mixamorigHead", ui(ze).up, 25 * n), we(De, hs.clone().add(L(1.4, 0, -0.6)), -1.2, i26 > X(114) ? yt("Jump", (i26 - X(114)) * 0.9) : yt("ThumbsUp", t * 0.8, false));
  let o = ps(e, [[0, 0], [0.25, 0.08], [0.75, 0.9], [1, 1]]);
  return Ja(hs, ke(4.5, 3.2, e), ke(1, 1 + Math.PI * 1.3, o), ke(1.2, 1.9, e), hs.clone().add(L(0, 1.45, 0)), 36), i26 > X(114.2) && i26 < X(115.8) && Ao("\u0417\u0430 \u043D\u0430\u0441.", "\u30AB\u30A4"), Hu(i26, 0.25), qt({ rift: 0, cryst: 0, dawn: 0.95, fog: 22e-4, fogC: 12618352, rain: 0, motes: 0.8, gold: 1, rise: 1, key: 12, keyCol: [1, 0.85, 0.7], hemi: 1, moon: 0.4, rim: 2.6, rimCol: [1, 0.6, 0.35], win: 0.1, sat: 1.1, bloom: 0.95, splash: 0, wet: 0.5, rays: 0.5, raysSun: true, flares: true });
});
tt(116, 124, "cut", ({ t: i26, u: e, lt: t }) => {
  we(fe, hs.clone().add(L(-0.35, 0, 0.1)), Math.PI * 0.85, Yt(fe, t)), we(ze, hs.clone().add(L(0.35, 0, 0.15)), Math.PI * 1.1, Yt(ze, t + 1)), we(De, hs.clone().add(L(0.05, 0, 0.7)), Math.PI, yt("Idle", t));
  let n = Un(xn(t / (6 * Tn)));
  Ge(L(ke(3, 25, n), ke(1.4, 60, n), ke(-424, -470, n)), Gi(hs.clone().add(L(0, 1.4, 0)), L(0, 30, -200), n), ke(38, 55, n));
  let s = He((i26 - X(117)) / 1.5) * (1 - He((i26 - X(122.2)) / 0.6));
  for (let r = 0; r < 4; r++) {
    let o = 30 + r * 6;
    Xn(L(-200, o, -300 - r * 20), L(200, o + 10, -300 - r * 20), [3, 2, 1], 0.4, s * 0.6);
  }
  return ci = { a: s, main: "\u0417\u0410 \u041D\u0410\u0421", sub: i26 > X(118.5) ? "DUBSTEP REMIX" : "", subA: He((i26 - X(118.5)) / 1.2) }, Hu(i26, 0.2 * (1 - n)), qt({ rift: 0, cryst: 0, dawn: 1, fog: 18e-4, fogC: 13144184, rain: 0, motes: 0.8, gold: 1, rise: 1, key: 10, keyCol: [1, 0.85, 0.7], hemi: 1, rim: 2.6, rimCol: [1, 0.6, 0.35], win: 0.05, sat: 1.1, splash: 0, wet: 0.5, rays: 0.5, raysSun: true, flares: true, fade: He((i26 - X(121.8)) / 1) });
});
var Xa = C0.sort((i26, e) => i26.t0 - e.t0), F0 = (i26) => Xa.find((e) => i26 >= e.t0 && i26 < e.t1) || Xa[Xa.length - 1], Ns = 0.13;
function wS(i26, e) {
  let t = 0, n = 1, s = 0, r = 0, o = 0, a = Xa.indexOf(e), l = Xa[a + 1], c = i26 - e.t0, u = l ? l.t0 - i26 : 1e9, f = e.tr, h = l ? l.tr : "cut", d = a % 2 ? 1 : -1;
  return f === "whip" && c < Ns && (t -= d * Math.pow(1 - c / Ns, 2) * 0.55), h === "whip" && u < Ns && (t += d * Math.pow(1 - u / Ns, 2) * 0.55), f === "zoom" && c < 0.18 && (n *= 1 + Math.pow(1 - c / 0.18, 2) * 0.6), h === "zoom" && u < 0.18 && (n *= 1 - Math.pow(1 - u / 0.18, 2) * 0.45), f === "flash" && c < 0.3 && (s += Math.pow(1 - c / 0.3, 2) * 1.2), h === "flash" && u < 0.08 && (s += (1 - u / 0.08) * 0.8), f === "fade" && c < 0.45 && (r = Math.max(r, 1 - c / 0.45)), h === "fade" && u < 0.45 && (r = Math.max(r, 1 - u / 0.45)), f === "glitch" && c < 0.2 && (o += 1 - c / 0.2), h === "glitch" && u < 0.12 && (o += 1 - u / 0.12), { yaw: t, fovM: n, flash: s, fade: r, glitch: o };
}
function u0(i26) {
  Au = [], Ru = [], _S = [], hr = null, ci = null;
  for (let o of [fe, ze, De]) o.holder.visible = false, o.holder.quaternion.identity();
  fr.visible = dr.visible = false;
  let e = F0(i26), t = i26 - e.t0, n = e.t1 - e.t0;
  Pt.uTime.value = i26;
  let s = e.fn({ t: i26, lt: t, u: t / n, dur: n }), r = wS(i26, e);
  if (s.whipBars) {
    let o = (i26 - e.t0) / Tn, a = o - Math.floor(o), l = a * Tn, c = (1 - a) * Tn;
    Math.floor(o) > 0 && l < Ns && (r.yaw -= Math.pow(1 - l / Ns, 2) * 0.5), c < Ns && (r.yaw += Math.pow(1 - c / Ns, 2) * 0.5);
  }
  return Ye.fov = md * r.fovM, Ye.updateProjectionMatrix(), Ye.rotateZ(pd), Ye.rotateY(r.yaw), Ye.updateMatrixWorld(true), { e: s, shot: e, tr: r };
}
var ka = new Kt();
function AS(i26) {
  let e = F0(i26), t = i26 - i0 * 0.5, n = 1;
  t < e.t0 && (t = Math.min(i26 + i0 * 0.5, e.t1 - 1e-4), n = -1), u0(t), ka.copy(Ye), ka.updateMatrixWorld(true);
  let { e: s, shot: r, tr: o } = u0(i26), a = s.worldT ?? i26;
  Pt.uTime.value = a, qa.visible = rd.visible = s.city, od.visible = s.roof && s.city, ud.visible = s.bridge && s.city, mr.visible = s.spire && s.city, bo.visible = s.club, Va.visible = s.sky;
  let l = !s.crystalsOff && s.city;
  hn.mesh.visible = Us.visible = v0.visible = l, ad.visible = b0.visible = true, E0.visible = s.city && s.sky, Pt.uFogColor.value.set(s.fogC), Pt.uFogDensity.value = s.fog, lt.fog.color.set(s.fogC), lt.fog.density = s.fog, Pt.uDawn.value = s.dawn, Pt.uCrystGlow.value = s.cryst, Pt.uWinOn.value = s.win, Pt.uWet.value = s.wet, Pt.uRiftE.value = s.rift * (1 - s.dawn), Pt.uRainAmt.value = Math.min(1, s.rain * 1.2), lt.background = new re(s.blackout ? 0 : s.fogC), lt.environment = s.dawn > 0.4 ? fS : m0;
  let c = s.city ? t0(fd, a) : 0;
  Va.material.uniforms.uRift.value = s.rift, Va.material.uniforms.uRiftW.value = s.riftW, Va.material.uniforms.uFlash.value = (s.flashB || 0) + c * 0.25, ld.intensity = c * 60, ld.position.copy(Ye.position).add(L(20, 60, -40)), Ga.visible = s.rain > 0, Ga.material.uniforms.uRain.value = s.rain, Ga.material.uniforms.uSlow.value = s.rainSlow ?? 1, Mu.visible = s.splash > 0 && s.rain > 0, Mu.material.uniforms.uAmt.value = s.splash * Math.min(1, s.rain * 1.3), ur.visible = s.motes > 0 || s.dust > 0, ur.material.uniforms.uAmt.value = Math.max(s.motes, (s.dust || 0) * 0.6), ur.material.uniforms.uEmber.value = s.ember, ur.material.uniforms.uGold.value = s.gold, ur.material.uniforms.uRise.value = s.rise;
  for (let k of rd.userData.mats) {
    let J = k.userData.flick, ve = Math.sin(i26 * (3 + J * 7) + J * 30) > -0.95 || J < 0.7 ? 1 : 0.15;
    k.color.copy(k.userData.base).multiplyScalar(ve * (1 - s.dawn * 0.8));
  }
  od.userData.blink.visible = Math.sin(i26 * 3) > 0.3, qa.userData.lampMat.color.setRGB(1.2 * (1 - s.dawn * 0.9), 2.2 * (1 - s.dawn * 0.9), 3.2 * (1 - s.dawn * 0.9)), Su.intensity = s.hemi, dd.intensity = s.moon, Tu.intensity = s.rim, Su.color.set(s.dawn > 0.3 ? 16765104 : 4214912), Su.groundColor.set(s.dawn > 0.3 ? 6307888 : 4198432), Tu.color.setRGB(...s.rimCol || [1, 0.2, 0.4]), bu.intensity = s.key * (1 + (s.keyPulse || 0) * 2), bu.color.setRGB(...s.keyCol || [0.55, 0.75, 1]);
  let u = s.keyAt || (fe.holder.visible ? fe.holder.position : ze.holder.visible ? ze.holder.position : De.holder.position);
  bu.position.copy(u).add(s.keyUp ? L(0, 8, 0) : L(-2, 3, 3).applyAxisAngle(L(0, 1, 0), Math.atan2(Ye.position.x - u.x, Ye.position.z - u.z)));
  let f = mr.userData;
  f.coreMat.uniforms.uI.value = s.coreI ?? 1, f.coreMat.uniforms.uCrack.value = s.crack || 0;
  let h = a > Iu + 0.25;
  f.core.visible = f.halo.visible = !h, Ye.position.distanceTo(gn) < 70 && (f.halo.visible = false), f.halo.material.color.setRGB(0.1 * (s.coreI ?? 1), 0.2 * (s.coreI ?? 1), 0.5 * (s.coreI ?? 1)), f.core.scale.setScalar(1 + 0.04 * Nn(un.kick, i26, 0.1, 0.5));
  let d = f.ring, g = new Oe(), y = new vt();
  for (let k = 0; k < 40; k++) {
    let J = k / 40 * Math.PI * 2 + a * 0.25, ve = 22 + Math.sin(k * 7) * 4, _e = f.core.position.clone().add(L(Math.cos(J) * ve, Math.sin(k * 3.1 + a) * 5, Math.sin(J) * ve));
    y.setFromEuler(new rn(k, a * 0.5 + k, k * 0.3)), g.compose(_e, y, L(1.6, 3.5, 1.6)), d.setMatrixAt(k, g);
  }
  if (d.instanceMatrix.needsUpdate = true, d.visible = l && a > X(28.5), f.beams.forEach((k) => k.visible = false), mS(a), Eu.material.uniforms.uI.value = s.pillar || 0, Eu.visible = !!s.pillar, Mo.visible = false, s.trail) {
    Mo.visible = true;
    let k = s.trail.to.clone().sub(s.trail.from);
    Mo.position.copy(s.trail.to).add(L(0, 0.5, 0)), Mo.quaternion.setFromUnitVectors(L(0, 1, 0), k.clone().normalize()), Mo.scale.set(1, Math.min(k.length(), 40), 1), ds(s.trail.to.clone().add(L(0, 0.5, 0)), 6, [0.5, 1.2, 3]);
  }
  De.holder.visible && Ym(De, s.eyeI ?? 1, s.nanaCore ?? 0.8), De.holder.visible && (s.eyeI ?? 1) > 0.5 && De.eyes.forEach((k) => {
    let J = new C();
    k.getWorldPosition(J), ds(J, 0.25 * (s.eyeI ?? 1), [0.3, 0.7, 1.6]);
  });
  let m = id.get("dbg") || "";
  m.includes("L") && (Au = []), m.includes("G") && (Ru = []), m.includes("F") && (s.flares = false), m.includes("B") && (s.bloom = 0), m.includes("C") && (hn.mesh.visible = false, Us.visible = false), td.begin(Ye);
  for (let k of Au) td.add(...k);
  td.end(), nd.begin(Ye);
  for (let k of Ru) nd.add(...k);
  nd.end();
  let p = 0, M = 0;
  if (s.drop) {
    let k = Nn(un.snare, i26, 0.09, 0.6), J = Nn(un.kick, i26, 0.07, 0.5), ve = Nn(un.impact, i26, 0.25, 1.5), _e = 0.014 * k + 7e-3 * J + 0.035 * ve;
    p = (Math.sin(i26 * 91.3) + Math.sin(i26 * 57.1)) * _e, M = (Math.cos(i26 * 83.7) + Math.sin(i26 * 43.3)) * _e, Ye.fov += J * 3 + ve * 7 + k * 2, Ye.updateProjectionMatrix();
  }
  s.shake && !s.drop && (p = (Math.sin(i26 * 71.3) + Math.sin(i26 * 37.1)) * s.shake * 0.03, M = Math.cos(i26 * 63.7) * s.shake * 0.03), Ye.rotateX(M), Ye.rotateY(p), Ye.updateMatrixWorld(true), Pt.uCamPos.value.copy(Ye.position);

  post.bloom = s.bloom; post.radius = s.bloomR; post.threshold = s.bloomT; post.streak = s.streak;
  overlayTime = i26; overlaySettings = s;
  let _ = cd.uniforms;
  _.uTime.value = i26, _.uSat.value = s.sat, _.uTint.value.setRGB(...s.tint), _.uVig.value = s.vig, _.uGrain.value = s.grain, _.uContrast.value = s.contrast;
  let b = L(0, 0, -1).applyQuaternion(Ye.quaternion), T = Ye.position.clone().addScaledVector(b, 50).project(ka), A = -T.x * 0.5 * n, x = -T.y * 0.5 * n, E = Math.hypot(A, x), I = 0.09;
  E > I && (A *= I / E, x *= I / E), Math.abs(T.z) > 1 && (A = 0, x = 0), _.uBlur.value.set(A * 0.9, x * 0.9);
  let P = (Math.tan(ka.fov * Math.PI / 360) / Math.tan(Ye.fov * Math.PI / 360) - 1) * n, N = Ye.position.clone().sub(ka.position).dot(b) * n * 0.02;
  _.uZoom.value = xn(P * 0.9 + N, -0.08, 0.08);
  let B = s.drop ? Nn(un.impact, i26, 0.12, 0.8) : 0, D = s.drop ? Nn(un.snare, i26, 0.07, 0.35) : 0;
  _.uCA.value = 15e-4 + B * 0.014 + D * 5e-3 + o.glitch * 0.01, _.uGlitch.value = xn((s.glitch || 0) + o.glitch * 0.8 + (s.drop ? D * 0.18 : 0), 0, 1);
  let z = (s.flashW || 0) + B * 0.45 + o.flash + c * 0.12;
  _.uFlash.value.setRGB(z * 0.9, z * 0.95, z), _.uFade.value = Math.max(s.fade || 0, o.fade), _.uLens.value = s.lens || 0;
  let Y = 0;
  for (let k of xS) {
    let J = i26 - k;
    J >= 0 && J < 0.09 && (Y = 1);
  }
  _.uInvert.value = Y;
  let K = null;
  for (let k of hd) {
    let J = i26 - k.t;
    J >= 0 && J < 0.7 && (K = { s: k, a: J });
  }
  if (K) {
    let k = new xe(0.5, 0.5);
    if (K.s.p) {
      let J = K.s.p.clone().project(Ye);
      J.z < 1 && k.set(J.x * 0.5 + 0.5, J.y * 0.5 + 0.5);
    }
    _.uShock.value.set(k.x, k.y, K.a * 1.3, Math.exp(-K.a * 5) * 0.035 * K.s.s);
  } else _.uShock.value.set(0.5, 0.5, 0, 0);
  let ie = null;
  if (s.raysSun ? ie = Ye.position.clone().addScaledVector(Pt.uSunDir.value, 1e3) : s.raysAt && (ie = s.raysAt), (id.get("dbg") || "").includes("R") && (s.rays = 0), ie && s.rays) {
    let k = ie.clone().project(Ye);
    k.z < 1 ? (_.uSun.value.set(k.x * 0.5 + 0.5, k.y * 0.5 + 0.5), _.uRays.value = s.rays) : _.uRays.value = 0;
  } else _.uRays.value = 0;
  _.uRayCol.value.setRGB(...s.rayCol || (s.dawn > 0.3 ? [1.2, 0.9, 0.6] : [0.6, 0.8, 1.2]));

  post.shockPoint = K?.s.p || null; post.rayPoint = ie; post.rays = s.rays || 0;

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
function RS(i26, e) {
  let t = [];
  i26.rift > 0.5 && i26.dawn < 0.5 && t.push([To(0), [120, 180, 255], 0.7 * i26.rift]), i26.coreI && mr.userData.core.visible && t.push([gn, [120, 190, 255], 0.3]), i26.raysSun && t.push([Ye.position.clone().addScaledVector(Pt.uSunDir.value, 1e3), [255, 190, 120], 0.6]), i26.pillar && t.push([Vt.clone().add(L(0, 30, 0)), [255, 220, 160], 0.6]), Ie.save(), Ie.globalCompositeOperation = "lighter";
  for (let [n, s, r] of t) {
    let o = n.clone().project(overlayCamera);
    if (o.z > 1 || Math.abs(o.x) > 1.3 || Math.abs(o.y) > 1.3) continue;
    let a = (o.x * 0.5 + 0.5) * wi, l = e + (1 - (o.y * 0.5 + 0.5)) * Wn, c = wi / 2, u = e + Wn / 2, f = [[-0.35, 40, 0.18], [-0.7, 70, 0.1], [0.4, 25, 0.15], [1.25, 90, 0.08], [-1.1, 30, 0.12]];
    for (let [d, g, y] of f) {
      let m = c + (a - c) * d, p = u + (l - u) * d, M = Ie.createRadialGradient(m, p, 0, m, p, g);
      M.addColorStop(0, `rgba(${s[0]},${s[1]},${s[2]},${y * r})`), M.addColorStop(0.7, `rgba(${s[0]},${s[1]},${s[2]},${y * r * 0.4})`), M.addColorStop(1, "rgba(0,0,0,0)"), Ie.fillStyle = M, Ie.beginPath(), Ie.arc(m, p, g, 0, Math.PI * 2), Ie.fill();
    }
    let h = Ie.createRadialGradient(a, l, 0, a, l, 180 * r);
    h.addColorStop(0, `rgba(${s[0]},${s[1]},${s[2]},${0.35 * r})`), h.addColorStop(1, "rgba(0,0,0,0)"), Ie.fillStyle = h, Ie.fillRect(a - 200, l - 200, 400, 400), Ie.fillStyle = `rgba(${s[0]},${s[1]},${s[2]},${0.25 * r})`, Ie.fillRect(0, l - 1.5, wi, 3);
  }
  Ie.restore();
}
function CS(i26, e) {
  for (let t of gS) {
    let n = i26 - t.t, s = t.big ? 0.9 : 0.35;
    if (n < 0 || n > s) continue;
    let r = n / s, o = t.big ? ke(1.35, 1, Ka(r * 3)) : ke(1.2, 1.5, r), a = t.big ? r < 0.7 ? 1 : 1 - (r - 0.7) / 0.3 : 1 - r, l = Math.round(Dn * (t.big ? 0.19 : 0.11) * o);
    Ie.save(), Ie.textAlign = "center", Ie.textBaseline = "middle", Ie.font = `900 ${l}px "Noto Sans CJK JP", sans-serif`;
    let c = Dn / 2, u = e + Wn / 2;
    Ie.globalCompositeOperation = "lighter";
    let f = t.big && r < 0.3 ? 6 : 2;
    Ie.globalAlpha = a * 0.8, Ie.fillStyle = "#ff2a55", Ie.fillText(t.text, c - f, u), Ie.fillStyle = "#28d8ff", Ie.fillText(t.text, c + f, u), Ie.globalCompositeOperation = "source-over", Ie.globalAlpha = a * (t.big ? 0.9 : 0.6), Ie.lineWidth = t.big ? 4 : 2, Ie.strokeStyle = "#ffffff", Ie.strokeText(t.text, c, u), Ie.restore();
  }
}

}
