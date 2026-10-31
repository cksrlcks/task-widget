export type Phase = "focus" | "short" | "long"
export type PomoState = {
  phase: Phase
  /** 현재 집중 회차(1부터) */
  round: number
  status: "idle" | "running" | "paused" | "done"
  endsAt: number | null
  pausedLeftMs: number | null
  durationMs: number
}
export type Durations = {
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  longBreakEvery: number
}

const MIN = 60_000
const phaseMs = (p: Phase, d: Durations) =>
  (p === "focus" ? d.focusMin : p === "short" ? d.shortBreakMin : d.longBreakMin) * MIN

const idle = (phase: Phase, round: number, d: Durations): PomoState => ({
  phase,
  round,
  status: "idle",
  endsAt: null,
  pausedLeftMs: null,
  durationMs: phaseMs(phase, d),
})

export const initial = (d: Durations) => idle("focus", 1, d)

export const remaining = (s: PomoState, now: number) =>
  s.status === "running"
    ? Math.max(0, (s.endsAt ?? now) - now)
    : s.status === "done"
      ? 0
      : (s.pausedLeftMs ?? s.durationMs)

export function start(s: PomoState, now: number): PomoState {
  if (s.status === "running" || s.status === "done") return s
  return { ...s, status: "running", endsAt: now + remaining(s, now), pausedLeftMs: null }
}

export function pause(s: PomoState, now: number): PomoState {
  if (s.status !== "running") return s
  return { ...s, status: "paused", pausedLeftMs: remaining(s, now), endsAt: null }
}

export const reset = (s: PomoState, d: Durations) => idle(s.phase, s.round, d)

export function tick(s: PomoState, now: number): PomoState {
  if (s.status !== "running" || remaining(s, now) > 0) return s
  return { ...s, status: "done", endsAt: null, pausedLeftMs: null }
}

export function next(s: PomoState, d: Durations): PomoState {
  if (s.phase === "focus")
    return idle(s.round >= d.longBreakEvery ? "long" : "short", s.round, d)
  return idle("focus", s.phase === "long" ? 1 : s.round + 1, d)
}
