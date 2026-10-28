// Generated from the supplied HTML by tools/convert.py.
import { HalfFloatType as Xt, WebGLRenderTarget as Ct, ShaderMaterial as We, Color as re, Vector2 as xe, Vector4 as et } from 'three';
import { Pass as Ln, FullScreenQuad as jn } from 'three/examples/jsm/postprocessing/Pass.js';
export const StreakPass = class extends Ln {
  constructor(e, t) {
    super(), this.needsSwap = false;
    let n = { type: Xt };
    this.rtA = new Ct(Math.round(e / 4), Math.round(t / 4), n), this.rtB = new Ct(Math.round(e / 4), Math.round(t / 4), n), this.strength = 0.35, this.th = new jn(new We({ uniforms: { tDiffuse: { value: null } }, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }", fragmentShader: "uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; float l = max(max(c.r,c.g),c.b); gl_FragColor = vec4(c*smoothstep(1.2, 3.5, l), 1.); }" })), this.blur = new jn(new We({ uniforms: { tDiffuse: { value: null }, uStep: { value: 1 }, uTexel: { value: 1 / (e / 4) } }, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }", fragmentShader: `uniform sampler2D tDiffuse; uniform float uStep, uTexel; varying vec2 vUv;
        void main(){ vec3 s = vec3(0.); float wsum = 0.;
          for (int i=-8;i<=8;i++){ float f = float(i); float w = exp(-f*f/30.); s += texture2D(tDiffuse, vUv + vec2(f*uStep*uTexel, 0.)).rgb*w; wsum += w; }
          gl_FragColor = vec4(s/wsum, 1.); }` })), this.comp = new jn(new We({ uniforms: { tDiffuse: { value: null }, tStreak: { value: null }, uS: { value: 0.35 } }, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }", fragmentShader: `uniform sampler2D tDiffuse, tStreak; uniform float uS; varying vec2 vUv;
        void main(){ vec3 c = texture2D(tDiffuse, vUv).rgb; vec3 s = texture2D(tStreak, vUv).rgb; gl_FragColor = vec4(c + s*vec3(0.45,0.7,1.4)*uS, 1.); }` })), this.copyRT = new Ct(e, t, n);
  }
  setSize(w, h) {
    this.rtA.setSize(Math.max(1, Math.round(w/4)), Math.max(1, Math.round(h/4)));
    this.rtB.setSize(Math.max(1, Math.round(w/4)), Math.max(1, Math.round(h/4)));
    this.copyRT.setSize(w,h); this.blur.material.uniforms.uTexel.value = 1/this.rtA.width;
  }
  dispose() {
    for(const target of [this.rtA,this.rtB,this.copyRT]) target.dispose();
    for(const quad of [this.th,this.blur,this.comp,this.copyBack]) if(quad) { quad.material.dispose(); quad.dispose(); }
  }
  render(e, t, n) {
    this.th.material.uniforms.tDiffuse.value = n.texture, e.setRenderTarget(this.rtA), this.th.render(e);
    let s = this.rtA, r = this.rtB;
    for (let o of [1.5, 4, 9]) this.blur.material.uniforms.tDiffuse.value = s.texture, this.blur.material.uniforms.uStep.value = o, e.setRenderTarget(r), this.blur.render(e), [s, r] = [r, s];
    this.comp.material.uniforms.tDiffuse.value = n.texture, this.comp.material.uniforms.tStreak.value = s.texture, this.comp.material.uniforms.uS.value = this.strength, e.setRenderTarget(this.copyRT), this.comp.render(e), this.copyBack = this.copyBack || new jn(new We({ uniforms: { tDiffuse: { value: null } }, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }", fragmentShader: "uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tDiffuse, vUv); }" })), this.copyBack.material.uniforms.tDiffuse.value = this.copyRT.texture, e.setRenderTarget(n), this.copyBack.render(e);
  }
};
export const filmShader = { uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uCA: { value: 15e-4 }, uVig: { value: 0.9 }, uGrain: { value: 0.03 }, uFlash: { value: new re(0, 0, 0) }, uFade: { value: 0 }, uTint: { value: new re(1, 1, 1) }, uSat: { value: 1 }, uBlur: { value: new xe(0, 0) }, uZoom: { value: 0 }, uSun: { value: new xe(0.5, 0.5) }, uRays: { value: 0 }, uRayCol: { value: new re(1, 0.9, 0.7) }, uLens: { value: 0 }, uGlitch: { value: 0 }, uShock: { value: new et(0.5, 0.5, 0, 0) }, uInvert: { value: 0 }, uAspect: { value: 1280 / 536 }, uContrast: { value: 1.05 } }, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }", fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime, uCA, uVig, uGrain, uFade, uSat, uZoom, uRays, uLens, uGlitch, uInvert, uAspect, uContrast;
    uniform vec3 uFlash, uTint, uRayCol; uniform vec2 uBlur, uSun; uniform vec4 uShock; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    vec2 lensDrop(vec2 uv, out float rim){
      rim = 0.;
      vec2 off = vec2(0.);
      for (int L=0; L<2; L++){
        float sc = L==0 ? 9. : 17.;
        vec2 g = vec2(uv.x*uAspect, uv.y)*sc;
        float fall = L==0 ? uTime*0.03 : 0.;
        g.y += fall*sc;
        vec2 id = floor(g); vec2 f = fract(g) - 0.5;
        float r = h(id + float(L)*7.1);
        if (r > 0.55) {
          vec2 c = vec2(h(id+1.3), h(id+2.7)) - 0.5; c *= 0.6;
          float rad = 0.12 + 0.18*h(id+4.1);
          vec2 d = f - c; d.y *= 1.2 - 0.2*float(L);
          float dl = length(d);
          float m = smoothstep(rad, rad*0.85, dl);
          off += -d*m*0.9/sc;
          rim += smoothstep(rad*0.7, rad, dl)*m;
        }
      }
      return off;
    }
    vec3 samp(vec2 uv){ return texture2D(tDiffuse, clamp(uv, 0.001, 0.999)).rgb; }
    void main(){
      vec2 uv = vUv;
      // glitch slices
      if (uGlitch > 0.) {
        float row = floor(uv.y*28.); float tt = floor(uTime*24.);
        float g = h(vec2(row, tt));
        if (g < uGlitch*0.6) uv.x += (h(vec2(row*1.7, tt+3.)) - 0.5)*0.12*uGlitch;
      }
      // shockwave ring distortion
      if (uShock.w > 0.) {
        vec2 d = uv - uShock.xy; d.x *= uAspect; float r = length(d);
        float x = r - uShock.z; float ring = exp(-x*x*260.);
        uv -= normalize(d + 1e-5)*ring*uShock.w*vec2(1./uAspect, 1.);
      }
      // lens rain
      float rim = 0.;
      if (uLens > 0.) { uv += lensDrop(uv, rim)*uLens; }
      // motion + zoom blur
      vec3 col = vec3(0.); float bl = length(uBlur) + abs(uZoom);
      if (bl > 0.0008) {
        for (int i=0;i<10;i++){ float k = float(i)/9. - 0.5; col += samp(uv + uBlur*k + (uv-0.5)*uZoom*k); }
        col /= 10.;
      } else col = samp(uv);
      // chromatic aberration (edges)
      vec2 c = uv - 0.5; float r2 = dot(c, c);
      vec2 off = c*uCA*(1. + r2*4.);
      col.r = mix(col.r, samp(uv - off).r, 0.8); col.b = mix(col.b, samp(uv + off).b, 0.8);
      if (uGlitch > 0.) { col.r = mix(col.r, samp(uv + vec2(0.012*uGlitch, 0.)).r, uGlitch); col.b = mix(col.b, samp(uv - vec2(0.012*uGlitch, 0.)).b, uGlitch); }
      // god rays
      if (uRays > 0.) {
        vec2 d = (uSun - uv)/24.; vec2 p = uv; float dec = 1.; vec3 acc = vec3(0.);
        for (int i=0;i<24;i++){ p += d; vec3 s = samp(p); float l = dot(s, vec3(0.3,0.59,0.11)); acc += s*smoothstep(0.82, 1.0, l)*dec; dec *= 0.95; }
        col += acc/24.*uRays*uRayCol*1.2;
      }
      col += vec3(0.6,0.75,1.0)*rim*0.08*uLens;
      float l = dot(col, vec3(0.299,0.587,0.114)); col = mix(vec3(l), col, uSat);
      col = (col - 0.5)*uContrast + 0.5;
      col *= uTint;
      col *= 1. - uVig*r2*1.1;
      col += (h(vUv*vec2(1280.,536.) + uTime*37.) - 0.5)*uGrain;
      col += uFlash;
      if (uInvert > 0.) { float li = dot(col, vec3(0.3,0.59,0.11)); col = mix(col, vec3(1.) - vec3(smoothstep(0.15, 0.6, li)), uInvert); }
      col = mix(col, vec3(0.), uFade);
      gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
    }` };
