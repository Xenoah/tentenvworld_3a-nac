import { Vector3 } from 'three'

export const DURATION = 213.9
export const IDLE_TIME = 12
export const EYE_HEIGHT = 1.65
export const DECK_HALF = 6
export const BGM_VOLUME = 0.08
export const MV_VOLUME = 0.72
export type Playback = { playing: boolean; startAt: number; offset: number; revision: number }
export const INITIAL: Playback = { playing: false, startAt: 0, offset: 0, revision: 0 }
export function positionAt(p: Playback, now: number) {
  return Math.max(0, Math.min(DURATION, p.offset + (p.playing ? Math.max(0, now - p.startAt) / 1000 : 0)))
}
export function isRunning(p: Playback, now: number) {
  return p.playing && now >= p.startAt && positionAt(p, now) < DURATION
}
export function startPlayback(p: Playback, now: number): Playback {
  return { playing: true, startAt: now + 3000, offset: 0, revision: p.revision + 1 }
}
export function stopPlayback(p: Playback): Playback {
  return { ...INITIAL, revision: p.revision + 1 }
}
export type DeckPose = { position: Vector3; yaw: number }
const UP = new Vector3(0, 1, 0)
/** Carry a walking passenger by the deck delta, preserving their own motion/look offset. */
export function carryPassenger(foot: Vector3, previous: DeckPose, next: DeckPose) {
  const local = foot.clone().sub(previous.position).applyAxisAngle(UP, -previous.yaw)
  local.x = Math.max(-DECK_HALF + 0.5, Math.min(DECK_HALF - 0.5, local.x))
  local.z = Math.max(-DECK_HALF + 0.5, Math.min(DECK_HALF - 0.5, local.z))
  local.y = 0.04
  return local.applyAxisAngle(UP, next.yaw).add(next.position)
}
export function yawDelta(from: number, to: number) { return Math.atan2(Math.sin(to - from), Math.cos(to - from)) }
