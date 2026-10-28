import { Camera, CanvasTexture, HalfFloatType, NoBlending, PerspectiveCamera, Scene, ShaderMaterial, Vector2, Vector3, Vector4, WebGLRenderer, WebGLRenderTarget } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { filmShader, StreakPass } from './film-post.js'
import type { Film } from './film.js'

/** Render each tracked eye separately, then copy into that eye's XR framebuffer viewport. */
export class FilmEffects {
  private composer: EffectComposer
  private scenePass: RenderPass
  private bloom = new UnrealBloomPass(new Vector2(1, 1), 0.9, 0.55, 0.8)
  private streak = new StreakPass(4, 4)
  private output = new OutputPass()
  private effect = new ShaderPass(filmShader)
  private eye = new PerspectiveCamera()
  private size = new Vector2()
  private viewport = new Vector4()
  private scissor = new Vector4()
  private projected = new Vector3()
  private canvas = document.createElement('canvas')
  private context: CanvasRenderingContext2D
  private overlay: CanvasTexture
  private copy: FullScreenQuad
  private width = 0
  private height = 0

  constructor(private renderer: WebGLRenderer, scene: Scene, camera: Camera, private film: Film) {
    const target = new WebGLRenderTarget(4, 4, { type: HalfFloatType, samples: 4 })
    this.composer = new EffectComposer(renderer, target)
    this.composer.setPixelRatio(1)
    this.composer.renderToScreen = false
    this.scenePass = new RenderPass(scene, camera)
    for (const pass of [this.scenePass, this.bloom, this.streak, this.output, this.effect]) this.composer.addPass(pass)
    this.eye.matrixAutoUpdate = false
    this.eye.matrixWorldAutoUpdate = false
    this.context = this.canvas.getContext('2d')!
    this.overlay = new CanvasTexture(this.canvas)
    this.overlay.generateMipmaps = false
    this.copy = new FullScreenQuad(new ShaderMaterial({
      uniforms: { tDiffuse: { value: null }, tOverlay: { value: this.overlay } },
      depthTest: false, depthWrite: false, blending: NoBlending, toneMapped: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
      // OutputPass already performed tone mapping and display encoding; do not encode twice.
      fragmentShader: 'uniform sampler2D tDiffuse,tOverlay; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv); vec4 o=texture2D(tOverlay,vUv); gl_FragColor=vec4(mix(c.rgb,o.rgb,o.a),1.); }',
    }))
  }

  render(scene: Scene, camera: Camera, dt: number) {
    const gl = this.renderer, xr = gl.xr
    const isXR = xr.enabled && xr.isPresenting
    scene.updateMatrixWorld()
    camera.updateWorldMatrix(true, false)
    if (isXR && xr.cameraAutoUpdate) xr.updateCamera(camera as PerspectiveCamera)
    const views = isXR ? xr.getCamera().cameras : [camera]
    const target = gl.getRenderTarget(), enabled = xr.enabled, autoClear = gl.autoClear
    const scissorTest = gl.getScissorTest(), pixelRatio = gl.getPixelRatio()
    gl.getViewport(this.viewport); gl.getScissor(this.scissor); gl.getDrawingBufferSize(this.size)
    const post = this.film.post
    this.bloom.strength = post.bloom; this.bloom.radius = post.radius; this.bloom.threshold = post.threshold
    this.streak.strength = post.streak
    // Share the timeline uniforms, but project world-space effect sources for the actual eye.
    this.effect.uniforms = post.uniforms
    this.effect.material.uniforms = post.uniforms
    xr.enabled = false
    try {
      for (const view of views) {
        const vp = isXR ? (view as PerspectiveCamera & { viewport: Vector4 }).viewport : new Vector4(0, 0, this.size.x, this.size.y)
        const scale = Math.min(1, 1280 / Math.max(vp.z, vp.w))
        const w = Math.max(1, Math.round(vp.z * scale)), h = Math.max(1, Math.round(vp.w * scale))
        if (w !== this.width || h !== this.height) {
          this.composer.setSize(w, h); this.canvas.width = w; this.canvas.height = h
          this.width = w; this.height = h
        }
        // XR subcameras carry local transforms AND world matrices. Preserve the world matrices.
        this.eye.matrixWorld.copy(view.matrixWorld); this.eye.matrixWorldInverse.copy(view.matrixWorldInverse)
        this.eye.projectionMatrix.copy(view.projectionMatrix); this.eye.projectionMatrixInverse.copy(view.projectionMatrixInverse)
        this.eye.layers.mask = view.layers.mask
        this.eye.position.setFromMatrixPosition(view.matrixWorld)
        this.scenePass.scene = scene; this.scenePass.camera = this.eye
        this.film.uniforms.uCamPos.value.copy(this.eye.position)
        const u = post.uniforms
        u.uAspect.value = vp.z / vp.w
        if (post.shockPoint) {
          this.projected.copy(post.shockPoint).project(this.eye)
          u.uShock.value.x = this.projected.z < 1 ? this.projected.x * 0.5 + 0.5 : 0.5
          u.uShock.value.y = this.projected.z < 1 ? this.projected.y * 0.5 + 0.5 : 0.5
        }
        u.uRays.value = 0
        if (post.rayPoint && post.rays) {
          this.projected.copy(post.rayPoint).project(this.eye)
          if (this.projected.z < 1) {
            u.uSun.value.set(this.projected.x * 0.5 + 0.5, this.projected.y * 0.5 + 0.5)
            u.uRays.value = post.rays
          }
        }
        gl.setScissorTest(false); gl.autoClear = true
        this.composer.render(dt)
        this.film.drawOverlay(this.context, this.eye, w, h)
        this.overlay.needsUpdate = true
        ;(this.copy.material as ShaderMaterial).uniforms.tDiffuse.value = this.composer.readBuffer.texture
        gl.setRenderTarget(target)
        gl.setViewport(vp.x / pixelRatio, vp.y / pixelRatio, vp.z / pixelRatio, vp.w / pixelRatio)
        gl.setScissor(vp.x / pixelRatio, vp.y / pixelRatio, vp.z / pixelRatio, vp.w / pixelRatio)
        gl.setScissorTest(true); gl.autoClear = false
        this.copy.render(gl)
      }
    } finally {
      gl.setRenderTarget(target); gl.setViewport(this.viewport); gl.setScissor(this.scissor)
      gl.setScissorTest(scissorTest); gl.autoClear = autoClear; xr.enabled = enabled
    }
  }

  dispose() {
    for (const pass of [this.scenePass, this.bloom, this.streak, this.output, this.effect]) pass.dispose()
    this.composer.dispose(); this.overlay.dispose(); this.copy.material.dispose(); this.copy.dispose()
  }
}
