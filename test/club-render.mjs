// Regression for NaN pixels in the nightclub light cones spreading through bloom.
// Run with the TenTenV client (:5190) and world dev server (:5182) available.
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const out = resolve(process.env.ZA_TEST_OUTPUT || 'test-results')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] })
const errors = []
try {
  const page = await browser.newPage({ viewport: { width: 640, height: 400 } })
  page.on('pageerror', e => errors.push(e.message))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  const base = '/@fs/' + resolve('worlds/za-nas').replaceAll('\\', '/')
  await page.route('**/club-regression', r => r.fulfill({ contentType: 'text/html', body: `<style>body{margin:0}</style><script type="module">
    import * as T from '/node_modules/.vite/deps/three.js';
    import {createFilm} from '${base}/src/film.js';
    import {FilmEffects} from '${base}/src/effects.ts';
    const renderer=new T.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(640,400);renderer.toneMapping=T.ACESFilmicToneMapping;document.body.appendChild(renderer.domElement);
    const film=await createFilm({renderer,assetUrl:p=>'${base}/public/'+p});
    const scene=new T.Scene();scene.add(film.scene);
    const camera=new T.PerspectiveCamera(75,640/400,.03,6000);
    const effects=new FilmEffects(renderer,scene,camera,film);
    window.d={T,renderer,film,scene,camera,effects,club:film.scene.children.find(o=>o.userData.cones)};
  </script>` }))
  await page.goto('http://127.0.0.1:5190/club-regression')
  await page.waitForFunction(() => window.d, {}, { timeout: 90000 })
  const result = await page.evaluate(() => {
    const { T, renderer, film, scene, camera, effects, club } = window.d
    const pixels = new Uint16Array(640 * 400 * 4)
    function stats(target) {
      renderer.readRenderTargetPixels(target, 0, 0, 640, 400, pixels)
      let nan = 0, infinity = 0, sum = 0, max = 0
      for (let i = 0; i < pixels.length; i++) {
        if (i % 4 === 3) continue
        const v = T.DataUtils.fromHalfFloat(pixels[i])
        if (Number.isNaN(v)) nan++
        else if (!Number.isFinite(v)) infinity++
        else { sum += v; max = Math.max(max, v) }
      }
      return { nan, infinity, max, mean: sum / (640 * 400 * 3) }
    }
    window.d.records = []
    for (const pass of effects.composer.passes) {
      const render = pass.render.bind(pass)
      pass.render = function (...args) {
        render(...args)
        window.d.records.push({ pass: pass.constructor.name, ...stats(pass.needsSwap ? args[1] : args[2]) })
      }
    }
    function frame(time, pitch, turn = 0) {
      film.update(time)
      scene.background = film.scene.background; scene.fog = film.scene.fog; scene.environment = film.scene.environment
      const dir = new T.Vector3(0, 0, -1).applyQuaternion(film.camera.quaternion)
      const yaw = Math.atan2(-dir.x, -dir.z)
      camera.position.copy(film.camera.position).add(new T.Vector3(-1.2, -.11, 1).applyAxisAngle(new T.Vector3(0, 1, 0), yaw))
      camera.rotation.set(pitch, yaw + turn, 0, 'YXZ'); camera.updateMatrixWorld(true)
      window.d.records = []; effects.render(scene, camera, 1 / 60)
      return { time, pitch, turn, passes: window.d.records }
    }
    const fixedShaders = club.userData.cones.map(c => c.material.fragmentShader)
    function legacy(enabled) {
      club.userData.cones.forEach((cone, i) => {
        cone.material.fragmentShader = enabled ? fixedShaders[i].replace('pow(clamp(vY,0.,1.),1.5)', 'pow(vY,1.5)') : fixedShaders[i]
        cone.material.needsUpdate = true
      })
    }
    window.d.frame = frame; window.d.legacy = legacy
    legacy(true)
    const original = frame(36, 0), originalUp = frame(36, .8)
    for (const target of [effects.composer.renderTarget1, effects.composer.renderTarget2]) { target.samples = 0; target.dispose() }
    const originalWithoutMSAA = frame(36, 0)
    for (const target of [effects.composer.renderTarget1, effects.composer.renderTarget2]) { target.samples = 4; target.dispose() }
    legacy(false)
    const fixed = []
    for (const time of [26, 36, 44]) for (const pitch of [-.35, 0, .8]) for (const turn of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) fixed.push(frame(time, pitch, turn))
    return { original, originalUp, originalWithoutMSAA, fixed }
  })
  for (const f of result.fixed) for (const p of f.passes) {
    assert.equal(p.nan + p.infinity, 0, `Non-finite HDR pixels at ${f.time}s, pitch=${f.pitch}, turn=${f.turn}, ${p.pass}`)
  }
  const fixedHorizontal = result.fixed.find(f => f.time === 36 && f.pitch === 0 && f.turn === 0)
  assert.ok(fixedHorizontal.passes.at(-1).mean > .02, 'Horizontal nightclub view must remain visible after bloom')
  // Some drivers define a harmless result for negative pow. Record reproduction, but
  // always require the corrected shader to produce finite pixels on the active GPU.
  result.legacyReproduced = result.original.passes[0].nan > 0
  await page.evaluate(() => { window.d.legacy(true); window.d.frame(36, 0) })
  await page.screenshot({ path: resolve(out, 'club-before.png') })
  await page.evaluate(() => { window.d.legacy(false); window.d.frame(36, 0) })
  await page.screenshot({ path: resolve(out, 'club-after.png') })
  console.log('PASS nightclub HDR pixels finite across', result.fixed.length, 'views; legacy NaNs:', result.original.passes[0].nan, '->', fixedHorizontal.passes[0].nan)

  const client = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  client.on('pageerror', e => errors.push(e.message))
  await client.goto('http://127.0.0.1:5190/?devWorld=http%3A%2F%2Flocalhost%3A5182%2F')
  await client.waitForFunction(() => [...(window.__ttvEngine?.interactables.values() || [])].some(i => i.spec().label === '▶ 全員で最初から再生' && i.spec().enabled), {}, { timeout: 90000 })
  await client.locator('canvas').first().click()
  await client.evaluate(() => {
    const e = window.__ttvEngine, clock = e.runtime.clock, now = clock().now()
    e.runtime.clock = () => ({ ...clock(), now: () => now })
    e.runtime.state.set('w:za-nas:playback:v1', { playing: true, startAt: now, offset: 36, revision: 123 })
  })
  await client.waitForTimeout(700)
  result.clientViews = []
  for (const pitch of [0, .8]) {
    await client.evaluate(pitch => { window.__ttvEngine.player.pitch = pitch }, pitch)
    await client.waitForTimeout(350)
    const png = await client.screenshot({ path: resolve(out, pitch ? 'club-pc-up.png' : 'club-pc-horizontal.png') })
    const brightness = await client.evaluate(async bytes => {
      const image = await createImageBitmap(new Blob([new Uint8Array(bytes)], { type: 'image/png' }))
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
      const { data } = ctx.getImageData(100, 100, image.width - 200, image.height - 250)
      let sum = 0; for (let i = 0; i < data.length; i += 4) sum += data[i] + data[i + 1] + data[i + 2]
      return sum / (data.length / 4 * 3)
    }, Array.from(png))
    assert.ok(brightness > 5, `PC view is unexpectedly black at pitch ${pitch}: ${brightness}`)
    result.clientViews.push({ pitch, meanRGB: brightness })
  }
  assert.deepEqual(errors, [])
  await writeFile(resolve(out, 'club-results.json'), JSON.stringify({ ...result, errors }, null, 2))
  console.log('PASS actual PC client horizontal/up views:', JSON.stringify(result.clientViews))
} finally { await browser.close() }
