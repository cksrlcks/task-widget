import { expect, test } from "vitest"
import { fracToMin } from "./barScale"
import {
  initial,
  pause,
  remaining,
  reset,
  setDuration,
  start,
  syncIdle,
  tick,
} from "./pomodoro"

test("remaining is based on wall clock, not ticks", () => {
  const s = start(initial(25), 0)
  expect(remaining(s, 10 * 60_000)).toBe(15 * 60_000)
})
test("pause freezes remaining, start resumes", () => {
  let s = pause(start(initial(25), 0), 60_000)
  expect(remaining(s, 999_999)).toBe(24 * 60_000)
  s = start(s, 1_000_000)
  expect(remaining(s, 1_060_000)).toBe(23 * 60_000)
})
test("tick past end marks done; start again restarts full duration", () => {
  const s = tick(start(initial(25), 0), 25 * 60_000 + 1)
  expect(s.status).toBe("done")
  expect(remaining(start(s, 0), 0)).toBe(25 * 60_000)
})
test("idle follows default minutes; running and paused keep theirs", () => {
  expect(syncIdle(initial(25), 50).durationMs).toBe(50 * 60_000)
  const running = start(initial(25), 0)
  expect(syncIdle(running, 50)).toBe(running)
  const paused = pause(running, 60_000)
  expect(syncIdle(paused, 50)).toBe(paused)
  const same = initial(25)
  expect(syncIdle(same, 25)).toBe(same)
})
test("setDuration sets idle duration, ignored while running; reset keeps it", () => {
  const s = setDuration(pause(start(initial(25), 0), 60_000), 40 * 60_000)
  expect(s.status).toBe("idle")
  expect(remaining(s, 0)).toBe(40 * 60_000)
  const running = start(s, 0)
  expect(setDuration(running, 15 * 60_000)).toBe(running)
  expect(remaining(reset(pause(running, 60_000)), 0)).toBe(40 * 60_000)
})
test("fracToMin snaps to minutes and clamps to 1..scale", () => {
  expect(fracToMin(0.25, 60)).toBe(15)
  expect(fracToMin(0.25, 120)).toBe(30)
  expect(fracToMin(-0.2, 60)).toBe(1)
  expect(fracToMin(1.3, 60)).toBe(60)
})
