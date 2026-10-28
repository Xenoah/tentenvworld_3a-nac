// Start the TenTenV dev client (:5190) and this world (:5182) before running.
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const out = resolve(process.env.ZA_TEST_OUTPUT || 'test-results')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true,
  args: ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
})
const checks = [], errors = []
const key = 'w:za-nas:playback:v1'
const url = 'http://127.0.0.1:5190/?devWorld=http%3A%2F%2Flocalhost%3A5182%2F'
const check = (label, condition, detail = '') => { checks.push({ label, passed: !!condition, detail }); console.log(condition ? 'PASS' : 'FAIL', label, detail); assert.ok(condition, label) }
const click = (page, label) => page.evaluate(label => {
  const e = window.__ttvEngine
  const item = [...e.interactables.values()].find(i => i.spec().label === label)
  if (!item || item.spec().enabled === false) throw Error(`Button unavailable: ${label}`)
  item.spec().onClick({ peerId: e.session.selfId, hand: 'none', point: [0, 0, 0] })
}, label)
const snapshot = page => page.evaluate(key => {
  const e = window.__ttvEngine, root = [...e.interactables.values()][0].obj
  let scene = root; while (scene.parent) scene = scene.parent
  if (!window.__renderProbeInstalled) {
    window.__renderProbeInstalled=true
    scene.onBeforeRender=renderer=>{window.__postprocessing=!!renderer.getRenderTarget()}
  }
  const deck = scene.getObjectByName('ZA_NAS_DECK'), film = scene.getObjectByName('ZA_NAS_FILM')
  const s = e.runtime.state.get(key), now = e.runtime.clock().now()
  const music = window.__zaAudio.filter(x => x.source.buffer?.duration > 200 && !x.stopped).at(-1)
  const local = e.player.position.clone().sub(deck.position).applyAxisAngle(new window.__TTV__.three.Vector3(0,1,0), -deck.rotation.y)
  return { state:s, now, time:s?.playing ? Math.min(213.9,Math.max(0,now-s.startAt)/1000+s.offset) : 0,
    host:e.runtime.hostId(), self:e.runtime.self().peerId, position:e.player.position.toArray(), postprocessing:window.__postprocessing,
    local:local.toArray(), deck:deck.position.toArray(), filmObjects:film?.children.length,
    audio:music ? {loop:music.source.loop,offset:music.offset,volume:music.gain?.gain.value,head:music.offset+music.source.context.currentTime-music.startedAt} : null }
}, key)
try {
  const context = await browser.newContext({ viewport: { width: 1100, height: 720 } })
  await context.addInitScript(() => {
    window.__zaAudio = []
    const proto = AudioContext.prototype, original = proto.createBufferSource
    proto.createBufferSource = function(...args) {
      const source = original.apply(this, args), record = { source, stopped:false }
      window.__zaAudio.push(record)
      const start = source.start, stop = source.stop, connect = source.connect
      source.start = function(when=0,offset=0,...args) { record.startedAt=this.context.currentTime; record.offset=offset; return start.call(this,when,offset,...args) }
      source.stop = function(...args) { record.stopped=true; return stop.apply(this,args) }
      source.connect = function(target,...args) { if(target.gain) record.gain=target; return connect.call(this,target,...args) }
      return source
    }
  })
  const open = async name => {
    const page = await context.newPage()
    page.on('pageerror', e => { errors.push(`${name}: ${e.stack}`); console.log('PAGE ERROR',name,e.stack) })
    page.on('console', m => { if(m.type()==='error' && !m.text().includes('No runtimes supported')) errors.push(`${name}: ${m.text()}`) })
    await page.goto(url)
    await page.waitForFunction(() => [...(window.__ttvEngine?.interactables.values() || [])].some(i => i.spec().label==='▶ 全員で最初から再生' && i.spec().enabled), {}, { timeout:90000 })
    await click(page, '音声 ON（端末の許可）')
    await page.waitForTimeout(1200)
    return page
  }
  const a = await open('A'), b = await open('B')
  await b.waitForTimeout(2500)
  const idle = await snapshot(a)
  check('3D scene loaded and BGM is quiet', idle.filmObjects > 10 && idle.audio?.loop && Math.abs(idle.audio.volume-0.08)<0.01, JSON.stringify(idle.audio))
  await a.screenshot({path:resolve(out,'explore.png')})
  await click(b,'▶ 全員で最初から再生')
  await a.waitForTimeout(5000)
  const first = await snapshot(a), second = await snapshot(b)
  check('non-host can start the shared movie', first.state?.playing && first.state.revision===second.state?.revision)
  check('both participants use the same timeline', Math.abs(first.time-second.time)<0.25, `${first.time.toFixed(3)} / ${second.time.toFixed(3)}`)
  check('screen effects are applied during shared playback',first.postprocessing===true)
  check('movie audio follows the shared clock', !first.audio.loop && Math.abs(first.audio.head-first.time)<0.25 && first.audio.volume>0.6, JSON.stringify(first.audio))
  check('passenger stands on the moving deck', Math.abs(first.local[1])<0.3 && first.deck[1]>10, JSON.stringify(first.local))
  await a.screenshot({path:resolve(out,'movie.png')})
  await a.bringToFront(); await a.locator('canvas').first().click()
  const beforeWalk=await snapshot(a)
  await a.keyboard.down('KeyD'); await a.waitForTimeout(900); await a.keyboard.up('KeyD')
  const afterWalk=await snapshot(a)
  check('walking changes the passenger offset while movie continues', Math.abs(afterWalk.local[0]-beforeWalk.local[0])>0.3, `${beforeWalk.local[0].toFixed(2)} -> ${afterWalk.local[0].toFixed(2)}`)
  const c=await open('Late')
  const late=await snapshot(c), leader=await snapshot(a)
  check('late joiner receives current playback', late.state?.revision===leader.state.revision && Math.abs(late.time-leader.time)<0.25, `${late.time.toFixed(3)} / ${leader.time.toFixed(3)}`)
  check('late joiner boards the current deck', Math.abs(late.local[1])<0.3)
  await click(b,'自分だけ自由散策へ'); await b.waitForTimeout(600)
  const explore=await snapshot(b), movie=await snapshot(a)
  check('local exploration leaves global playback running', explore.state.playing && movie.state.playing && Math.abs(explore.position[1])<1, JSON.stringify({explore,movie}))
  await click(b,'■ 全員の上映を停止'); await a.waitForTimeout(1000)
  const stopped=await snapshot(a), stoppedC=await snapshot(c)
  check('any participant can stop everybody', !stopped.state.playing && !stoppedC.state.playing)
  check('stopping also removes screen effects',stopped.postprocessing===false)
  check('stopping restores quiet BGM and safe floor', stopped.audio.loop && stopped.audio.volume<0.1 && Math.abs(stopped.position[1])<1,JSON.stringify(stopped.audio))
  // Start again, then remove the host during the run.
  await click(c,'▶ 全員で最初から再生'); await c.waitForTimeout(4200)
  const host=await snapshot(a), oldState=host.state
  check('first participant owns the host role', host.self===host.host)
  await a.close(); await b.waitForTimeout(4500)
  const migrated=await snapshot(b)
  check('host migration preserves the movie start', migrated.state.startAt===oldState.startAt && migrated.state.playing)
  await click(c,'■ 全員の上映を停止'); await b.waitForTimeout(1000)
  check('playback controls work after host migration', !(await snapshot(b)).state.playing)
  // Sample every cut and representative middle frames. No persistent state is used in dev mode.
  const cuts=[0.024,20.9,35,49,70,90,110,130,150,172,185,205,213.85]
  await click(b,'自分だけ観覧床へ').catch(()=>{})
  for(const t of cuts) {
    await b.evaluate(([key,t])=>{const e=window.__ttvEngine;e.runtime.state.set(key,{playing:true,startAt:e.runtime.clock().now(),offset:t,revision:1000+Math.round(t*10)})},[key,t])
    await b.waitForTimeout(450)
  }
  await b.waitForTimeout(1200)
  check('movie completion returns to idle', !(await snapshot(b)).state.playing)
  check('no world or shader runtime errors', errors.length===0,errors.slice(0,5).join('\n'))
} finally {
  await writeFile(resolve(out,'multiplayer-results.json'),JSON.stringify({checks,errors},null,2))
  await browser.close()
}
