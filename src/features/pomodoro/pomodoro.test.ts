import { expect, test } from "vitest"
import { initial, next, pause, remaining, start, tick } from "./pomodoro"

const d = { focusMin: 25, shortBreakMin: 5, longBreakMin: 15, longBreakEvery: 4 }
test("remaining is based on wall clock, not ticks", () => {
  const s = start(initial(d), 0)
  expect(remaining(s, 10 * 60_000)).toBe(15 * 60_000)
})
test("pause freezes remaining, start resumes", () => {
  let s = pause(start(initial(d), 0), 60_000)
  expect(remaining(s, 999_999)).toBe(24 * 60_000)
  s = start(s, 1_000_000)
  expect(remaining(s, 1_060_000)).toBe(23 * 60_000)
})
test("tick past end marks done and does not auto start next", () => {
  const s = tick(start(initial(d), 0), 25 * 60_000 + 1)
  expect(s.status).toBe("done")
  expect(s.phase).toBe("focus")
})
test("focus -> short, and 4th focus -> long", () => {
  let s = initial(d)
  s = next(s, d)
  expect(s.phase).toBe("short")
  s = next(s, d)
  expect(s.phase).toBe("focus")
  expect(s.round).toBe(2)
  s = next(next(next(next(s, d), d), d), d)
  expect(s.round).toBe(4)
  s = next(s, d)
  expect(s.phase).toBe("long")
  s = next(s, d)
  expect(s.round).toBe(1)
})
test("changed durations apply from next phase only", () => {
  const s = start(initial(d), 0)
  const d2 = { ...d, focusMin: 50, shortBreakMin: 10 }
  expect(remaining(s, 0)).toBe(25 * 60_000)
  expect(next(s, d2).durationMs).toBe(10 * 60_000)
})
