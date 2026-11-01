export type PomoState = {
  status: "idle" | "running" | "paused" | "done"
  endsAt: number | null
  pausedLeftMs: number | null
  durationMs: number
}

const MIN = 60_000

export const initial = (min: number): PomoState => ({
  status: "idle",
  endsAt: null,
  pausedLeftMs: null,
  durationMs: min * MIN,
})

export const remaining = (s: PomoState, now: number) =>
  s.status === "running"
    ? Math.max(0, (s.endsAt ?? now) - now)
    : s.status === "done"
      ? 0
      : (s.pausedLeftMs ?? s.durationMs)

/** 끝난 뒤 다시 누르면 같은 시간으로 새로 시작한다 */
export function start(s: PomoState, now: number): PomoState {
  if (s.status === "running") return s
  const left = s.status === "done" ? s.durationMs : remaining(s, now)
  return { ...s, status: "running", endsAt: now + left, pausedLeftMs: null }
}

export function pause(s: PomoState, now: number): PomoState {
  if (s.status !== "running") return s
  return {
    ...s,
    status: "paused",
    pausedLeftMs: remaining(s, now),
    endsAt: null,
  }
}

// 다이얼로 직접 맞춘 시간이 있으면 그 시간으로 되돌린다
export const reset = (s: PomoState): PomoState => ({
  ...s,
  status: "idle",
  endsAt: null,
  pausedLeftMs: null,
})

/** 다이얼·퀵 버튼으로 시간을 정한다. 진행 중엔 무시 */
export function setDuration(s: PomoState, ms: number): PomoState {
  if (s.status === "running") return s
  return { ...reset(s), durationMs: ms }
}

export function tick(s: PomoState, now: number): PomoState {
  if (s.status !== "running" || remaining(s, now) > 0) return s
  return { ...s, status: "done", endsAt: null, pausedLeftMs: null }
}

/** 시작 전 대기 상태만 설정의 기본 시간을 바로 따른다 */
export function syncIdle(s: PomoState, min: number): PomoState {
  if (s.status !== "idle" || s.durationMs === min * MIN) return s
  return { ...s, durationMs: min * MIN }
}
