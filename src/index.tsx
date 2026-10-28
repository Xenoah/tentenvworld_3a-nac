import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Clickable, SpawnPad, TextPlane, useEmit, useIsHost, useNetClock, useNetEvent, usePlayers, useSyncedState, useTeleport, useWorldEnv } from '@tentenv/sdk'
import { Euler, Quaternion, Vector3, type Group } from 'three'
import { createFilm, type Film, type FilmFrame } from './film.js'
import { useFilmAudio } from './audio'
import { FilmEffects } from './effects'
import { DURATION, IDLE_TIME, EYE_HEIGHT, INITIAL, DECK_HALF, carryPassenger, positionAt, startPlayback, stopPlayback, yawDelta, type Playback, type DeckPose } from './timeline'

const EMPTY_FRAME: FilmFrame = { caption: '', title: '', subtitle: '', fade: 0, shot: 0 }
const UP = new Vector3(0, 1, 0)
const clockText = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

function Button({ text, x, y, onClick, color = '#172d48', enabled = true }: { text: string; x: number; y: number; onClick: () => void; color?: string; enabled?: boolean }) {
  return <Clickable label={text} onClick={onClick} enabled={enabled} reach={20} position={[x, y, 0]}>
    <mesh><boxGeometry args={[1.8, 0.32, 0.08]} /><meshBasicMaterial color={enabled ? color : '#282c34'} /></mesh>
    <TextPlane text={text} width={1.72} lineHeight={0.13} padding={0.02} position={[0, 0, 0.045]} color={enabled ? '#ffffff' : '#89929e'} />
  </Clickable>
}

export default function World() {
  const env = useWorldEnv()
  const [playback, setPlayback] = useSyncedState<Playback>('za-nas:playback:v1', INITIAL)
  const isHost = useIsHost(), emit = useEmit(), clock = useNetClock({ require: 'motion' })
  const players = usePlayers(), { teleport } = useTeleport()
  const [film, setFilm] = useState<Film | null>(null)
  const [loadError, setLoadError] = useState('')
  const [watching, setWatching] = useState(true)
  const watchingRef = useRef(true)
  const requestedTeleport = useRef<[number, number, number] | null>(null)
  const [muted, setMuted] = useState(false)
  const [view, setView] = useState({ time: 0, countdown: 0, active: false, frame: EMPTY_FRAME })
  const sound = useFilmAudio(playback, muted)
  const outer = useThree(s => s.scene)
  const renderer = useThree(s => s.gl)
  const camera = useThree(s => s.camera)
  const effects = useRef<FilmEffects | null>(null)
  const effectsActive = useRef(false)
  const explorerPanel = useRef(new Vector3(0, 1.6, 4.8))
  const deck = useRef<Group>(null), panel = useRef<Group>(null), caption = useRef<Group>(null)
  const body = useRef<RapierRigidBody>(null)
  const ground = useRef<RapierRigidBody>(null)
  const previous = useRef<DeckPose | null>(null)
  const trackedPosition = useRef<Vector3 | null>(null)
  const mode = useRef(false), uiTime = useRef(0), endedRevision = useRef(-1)
  const requestTimes = useRef(new Map<string, number>())
  const watch = () => { watchingRef.current = true; setWatching(true) }
  const start = () => { sound.unlock(); watch(); emit('za-nas-control', { action: 'start' }, 'host') }
  const stop = () => emit('za-nas-control', { action: 'stop' }, 'host')

  // Everyone may request playback; only the current host serializes the shared timeline.
  useNetEvent<{ action?: string }>('za-nas-control', (data, from) => {
    if (!isHost || !clock.trustworthy || !data || !['start', 'stop'].includes(data.action || '')) return
    if (!players.all.some(p => p.peerId === from.peerId)) return
    const now = clock.now()
    if (now - (requestTimes.current.get(from.peerId) ?? -Infinity) < 400) return
    requestTimes.current.set(from.peerId, now)
    setPlayback(p => data.action === 'start' ? startPlayback(p, now) : stopPlayback(p))
  })

  useEffect(() => {
    let alive = true, instance: Film | null = null
    const saved = { fog: outer.fog, background: outer.background, environment: outer.environment }
    void createFilm({ assetUrl: env.assetUrl, renderer }).then(f => {
      instance = f
      if (alive) setFilm(f); else f.dispose()
    }).catch(error => { if (alive) setLoadError(String(error)) })
    return () => {
      alive = false; instance?.dispose()
      outer.fog = saved.fog; outer.background = saved.background; outer.environment = saved.environment
    }
  }, [env, outer, renderer])

  useEffect(() => {
    if (!film) return
    const instance = new FilmEffects(renderer, outer, camera, film)
    effects.current = instance
    return () => { effects.current = null; instance.dispose() }
  }, [film, renderer, outer, camera])

  // Positive priority owns the final render, after player/head tracking and world updates.
  useFrame(({ gl, scene, camera }, dt) => {
    if (effectsActive.current && effects.current) effects.current.render(scene, camera, dt)
    else gl.render(scene, camera)
  }, 1)

  const active = playback.playing && view.time < DURATION
  const follow = watching && active && clock.trustworthy
  const goExplore = (p: [number, number, number] = [0, 0.05, 8]) => {
    watchingRef.current = false; setWatching(false); previous.current = null; requestedTeleport.current = p
    explorerPanel.current.set(p[0], p[1] + 1.6, p[2] - 3.2)
  }
  useFrame(({ camera }, dt) => {
    if (!film) { body.current?.setEnabled(false); return }
    const now = clock.now(), time = positionAt(playback, now)
    const isActive = playback.playing && time < DURATION
    effectsActive.current = isActive && now >= playback.startAt && clock.trustworthy
    const shouldFollow = watchingRef.current && isActive && clock.trustworthy
    // Keep the Rapier handles alive through mode changes (the character controller retains contacts).
    ground.current?.setEnabled(!shouldFollow)
    body.current?.setEnabled(shouldFollow)
    const frame = film.update(Math.max(0.024, isActive ? time : IDLE_TIME))
    outer.fog = film.scene.fog; outer.background = film.scene.background; outer.environment = film.scene.environment
    const direction = new Vector3(0, 0, -1).applyQuaternion(film.camera.quaternion)
    const yaw = Math.atan2(-direction.x, -direction.z)
    const position = film.camera.position.clone().add(new Vector3(0, -EYE_HEIGHT, 0))
    const next = { position, yaw }
    let headYaw: number | null = null
    let headPosition: Vector3 | null = null
    if (renderer.xr.isPresenting) {
      const space = renderer.xr.getReferenceSpace()
      const viewer = space ? renderer.xr.getFrame()?.getViewerPose(space) : null
      if (viewer) {
        const q = viewer.transform.orientation
        headYaw = new Euler().setFromQuaternion(new Quaternion(q.x, q.y, q.z, q.w), 'YXZ').y
        const p = viewer.transform.position
        headPosition = new Vector3(p.x, p.y, p.z)
      }
    }
    const previousTrackedPosition = trackedPosition.current
    trackedPosition.current = headPosition
    const movePlayer = (foot: [number, number, number], viewedYaw?: number) => {
      const origin = renderer.xr.isPresenting ? renderer.xr.getCamera().parent : null
      if (origin && headPosition && headYaw !== null) {
        // Move the tracking origin with the rail. Otherwise the client's room-scale controller
        // treats the deck displacement as physical walking and cancels it on the next update.
        const local = (previousTrackedPosition || headPosition).clone().multiplyScalar(origin.scale.x)
        local.applyAxisAngle(UP, viewedYaw === undefined ? origin.rotation.y : viewedYaw - headYaw)
        origin.position.x = foot[0] - local.x; origin.position.z = foot[2] - local.z
        origin.updateMatrixWorld(true)
      }
      teleport(foot, viewedYaw)
    }
    if (deck.current) { deck.current.position.copy(position); deck.current.rotation.set(0, yaw, 0) }
    if (body.current) { body.current.setTranslation(position, true); body.current.setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) }, true) }
    const pose = players.getPose(players.local.peerId)
    if (shouldFollow && pose) {
      if (!previous.current || !mode.current) {
        // Stable slots avoid placing late joiners inside an existing spectator.
        const index = players.all.map(p => p.peerId).sort().indexOf(players.local.peerId)
        const offset = new Vector3((index % 4 - 1.5) * 0.8, 0.04, 1 + Math.floor(index / 4) * 0.8).applyAxisAngle(UP, yaw)
        movePlayer(position.clone().add(offset).toArray(), yaw)
      } else {
        const foot = carryPassenger(new Vector3(...pose.position), previous.current, next)
        const turn = yawDelta(previous.current.yaw, yaw)
        if (renderer.xr.isPresenting) {
          // teleport(yaw) means HEAD yaw in XR, whereas PlayerPose.yaw is BODY yaw.
          // The XR camera already includes this frame's tracked head turn. Only add the deck turn.
          const viewedYaw = new Euler().setFromQuaternion(camera.getWorldQuaternion(new Quaternion()), 'YXZ').y
          movePlayer(foot.toArray(), headYaw === null ? undefined : viewedYaw + turn)
        } else movePlayer(foot.toArray(), pose.yaw + turn)
      }
      previous.current = { position: position.clone(), yaw }
    } else {
      if (mode.current && watchingRef.current) { movePlayer([0, 0.05, 8], 0); explorerPanel.current.set(0, 1.6, 4.8) }
      previous.current = null
    }
    if (requestedTeleport.current) { movePlayer(requestedTeleport.current, 0); requestedTeleport.current = null }
    mode.current = shouldFollow
    // Keep the panel fixed in the world so a desktop user can aim at each button.
    if (panel.current) {
      if (shouldFollow) {
        panel.current.position.copy(position).add(new Vector3(0, 1.5, 3.8).applyAxisAngle(UP, yaw))
        panel.current.rotation.set(0, yaw + Math.PI, 0)
      } else {
        panel.current.position.copy(explorerPanel.current)
        panel.current.rotation.set(0, 0, 0)
      }
    }
    if (caption.current) {
      caption.current.visible = shouldFollow && !!(frame.caption || frame.title)
      caption.current.position.copy(position).add(new Vector3(0, 2.45, -3.5).applyAxisAngle(UP, yaw))
      caption.current.rotation.set(0, yaw, 0)
    }
    film.uniforms.uCamPos.value.copy(camera.position)
    if (playback.playing && time >= DURATION && isHost && endedRevision.current !== playback.revision) {
      endedRevision.current = playback.revision
      setPlayback(p => stopPlayback(p))
    }
    uiTime.current += dt
    if (uiTime.current >= 0.15) {
      uiTime.current = 0
      setView({ time, countdown: Math.max(0, Math.ceil((playback.startAt - now) / 1000)), active: isActive, frame })
    }
  }, -100)

  return <>
    <SpawnPad position={[0, 0.05, 8]} yaw={0} />
    {film && <primitive object={film.scene} dispose={null} />}
    {/* The film's buildings, actors and effects have no colliders. Only walking surfaces do. */}
    <RigidBody ref={ground} type="fixed" colliders={false}>
      <CuboidCollider args={[1200, 0.1, 1600]} position={[0, -0.1, -400]} />
      <CuboidCollider args={[12, 0.1, 12]} position={[20, 42.05, -10]} />
    </RigidBody>
    <RigidBody ref={body} type="fixed" colliders={false}><CuboidCollider args={[DECK_HALF, 0.1, DECK_HALF]} position={[0, -0.1, 0]} /></RigidBody>
    <group ref={deck} name="ZA_NAS_DECK" visible={active}>
      {/* Transparent floor: thin edge lights indicate the walkable boundary. */}
      {[[-6, 0.012, 0, 0.025, 12], [6, 0.012, 0, 0.025, 12], [0, 0.012, -6, 12, 0.025], [0, 0.012, 6, 12, 0.025]].map(([x, y, z, w, d], i) =>
        <mesh key={i} position={[x, y, z]}><boxGeometry args={[w, 0.018, d]} /><meshBasicMaterial color="#63daf5" transparent opacity={0.25} /></mesh>)}
    </group>
    <group ref={caption} visible={false}>
      <TextPlane text={view.frame.caption || (view.frame.title ? `${view.frame.title}\n${view.frame.subtitle}` : '')} width={4.5} lineHeight={0.22} background="#04071299" padding={0.08} maxLines={3} depthTest={false} />
    </group>
    <group ref={panel} position={[0, 1.6, 4.8]}>
      <TextPlane text="ЗА НАС · 俺たちに" width={3.8} lineHeight={0.22} position={[0, 1.05, 0]} color="#80e5ff" bold />
      <TextPlane text={loadError ? `読み込み失敗: ${loadError}` : !film ? '街と登場人物を準備中…' : !clock.trustworthy ? '共有時計を同期中…' : view.active ? view.countdown ? `${view.countdown}秒後に全員同期で上映` : `全員同期 ${clockText(view.time)} / 3:34` : '自由散策 · BGM 8%'} width={3.9} lineHeight={0.14} position={[0, 0.76, 0]} background="#050c18cc" maxLines={2} />
      <Button text="▶ 全員で最初から再生" x={-0.96} y={0.4} onClick={start} color="#135465" enabled={!!film && clock.trustworthy} />
      <Button text="■ 全員の上映を停止" x={0.96} y={0.4} onClick={stop} color="#57283c" enabled={clock.trustworthy && playback.playing} />
      <Button text={follow ? '自分だけ自由散策へ' : '自分だけ観覧床へ'} x={-0.96} y={0} onClick={() => follow ? goExplore() : watch()} enabled={!!film && active} />
      <Button text={muted ? '自分の音声 ON' : '自分の音声 OFF'} x={0.96} y={0} onClick={() => { sound.unlock(); setMuted(!muted) }} />
      <Button text="街の入口へ" x={-0.96} y={-0.4} onClick={() => goExplore()} />
      <Button text="結晶の広場へ" x={0.96} y={-0.4} onClick={() => goExplore([0, 0.05, -590])} />
      <Button text="屋上へ" x={-0.96} y={-0.8} onClick={() => goExplore([20, 42.2, -10])} />
      <Button text="音声 ON（端末の許可）" x={0.96} y={-0.8} onClick={sound.unlock} />
      <TextPlane text={`${sound.status}\n上映中も歩行・見回し自由。操作盤は観覧床の後方。`} width={3.9} lineHeight={0.12} position={[0, -1.14, 0]} color="#b4c0d2" maxLines={2} background="#050c18cc" />
    </group>
  </>
}
