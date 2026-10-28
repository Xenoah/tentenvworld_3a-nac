import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { INITIAL, DURATION, startPlayback, stopPlayback, positionAt, isRunning, carryPassenger, yawDelta } from '../src/timeline'

test('late join and host migration derive the same time from a persisted start timestamp', () => {
  const state = startPlayback(INITIAL, 1_000_000)
  assert.equal(positionAt(state, 1_001_000), 0)
  assert.equal(isRunning(state, 1_001_000), false)
  assert.equal(positionAt(state, 1_083_250), 80.25)
  const received = JSON.parse(JSON.stringify(state))
  assert.equal(positionAt(received, 1_083_250), 80.25)
  assert.equal(positionAt(received, 2_000_000), DURATION)
  assert.equal(isRunning(received, 2_000_000), false)
})

test('stop invalidates the old run, and a later start has a distinct revision', () => {
  const start = startPlayback(INITIAL, 5000)
  const stop = stopPlayback(start)
  assert.equal(positionAt(stop, 200000), 0)
  assert.equal(isRunning(stop, 200000), false)
  assert.equal(startPlayback(stop, 200000).revision, 3)
})

test('walking offset is carried across a cut and a quarter turn without colliding with the film', () => {
  const prev = { position: new Vector3(0, 40, -20), yaw: 0 }
  const next = { position: new Vector3(250, 300, -600), yaw: Math.PI / 2 }
  const result = carryPassenger(new Vector3(2, 40.04, -1 + prev.position.z), prev, next)
  assert.ok(result.distanceTo(new Vector3(249, 300.04, -602)) < 1e-8)
  const outside = carryPassenger(new Vector3(500, -900, 800), prev, next).sub(next.position)
  assert.ok(Math.abs(outside.x) <= 5.5 && Math.abs(outside.z) <= 5.5)
  assert.ok(Math.abs(yawDelta(Math.PI - 0.01, -Math.PI + 0.01) - 0.02) < 1e-8)
})
