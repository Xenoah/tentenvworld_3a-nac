import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { AudioLoader } from 'three'
import { useAudioListener, useNetClock, useWorldEnv } from '@tentenv/sdk'
import { BGM_VOLUME, MV_VOLUME, positionAt, isRunning, type Playback } from './timeline'

/** One decoded track, scheduled against the shared clock. WebAudio also supports VR audio unlock. */
export function useFilmAudio(playback: Playback, muted: boolean) {
  const listener = useAudioListener()
  const context = listener.context
  const env = useWorldEnv()
  const clock = useNetClock({ require: 'motion' })
  const [status, setStatus] = useState('音源を準備中')
  const state = useRef({ buffer: null as AudioBuffer | null, source: null as AudioBufferSourceNode | null,
    gain: null as GainNode | null, key: '', startedAt: 0, offset: 0, checkAt: 0 })
  useEffect(() => {
    let alive = true
    const s = state.current
    s.gain = context.createGain(); s.gain.gain.value = 0; s.gain.connect(listener.getInput())
    new AudioLoader().load(env.assetUrl('music.mp3'), buffer => {
      if (!alive) return
      s.buffer = buffer; setStatus(context.state === 'running' ? '音声 ON' : '音声 ON を押してください')
    }, undefined, () => { if (alive) setStatus('音源の読み込みに失敗しました') })
    const unlock = () => { void context.resume().then(() => { if (alive && s.buffer) setStatus('音声 ON') }) }
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      alive = false; window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock)
      s.source?.stop(); s.source?.disconnect(); s.gain?.disconnect(); s.source = null; s.buffer = null; s.key = ''
    }
  }, [context, listener, env])
  useFrame(() => {
    const s = state.current
    if (!s.buffer || !s.gain || context.state !== 'running' || !clock.trustworthy) return
    const now = clock.now(), running = isRunning(playback, now)
    const key = running ? `mv:${playback.revision}` : 'bgm'
    const offset = running ? positionAt(playback, now) : (now / 1000 % s.buffer.duration + s.buffer.duration) % s.buffer.duration
    let drift = offset - (s.offset + context.currentTime - s.startedAt)
    if (!running) drift = ((drift + s.buffer.duration / 2) % s.buffer.duration + s.buffer.duration) % s.buffer.duration - s.buffer.duration / 2
    if (key !== s.key || !s.source || (context.currentTime > s.checkAt && Math.abs(drift) > 0.15)) {
      s.source?.stop(); s.source?.disconnect()
      const source = context.createBufferSource(); source.buffer = s.buffer; source.loop = !running
      source.connect(s.gain); source.start(0, Math.min(offset, s.buffer.duration - 0.01))
      s.source = source; s.key = key; s.offset = offset; s.startedAt = context.currentTime
    }
    if (context.currentTime > s.checkAt) s.checkAt = context.currentTime + 1
    s.gain.gain.setTargetAtTime(muted ? 0 : running ? MV_VOLUME : BGM_VOLUME, context.currentTime, 0.15)
  })
  return { status, unlock: () => { void context.resume().then(() => setStatus('音声 ON')) } }
}
