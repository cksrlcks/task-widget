import { useCallback, useEffect, useRef, useState } from "react"
import { isTauri } from "@/features/shell/platform"
import { useAppPrefs } from "@/features/settings/appPrefs"
import {
  initial,
  next,
  pause,
  remaining,
  reset,
  start,
  tick,
  type Durations,
  type PomoState,
} from "./pomodoro"

async function notify(body: string) {
  const n = await import("@tauri-apps/plugin-notification")
  // 권한이 없으면 처음 한 번 요청한다
  if (!(await n.isPermissionGranted())) {
    if ((await n.requestPermission()) !== "granted") return
  }
  n.sendNotification({ title: "뽀모도로", body })
}

export function usePomodoro() {
  const { focusMin, shortBreakMin, longBreakMin, longBreakEvery, sound } =
    useAppPrefs()
  const d: Durations = { focusMin, shortBreakMin, longBreakMin, longBreakEvery }
  const dRef = useRef(d)
  dRef.current = d
  const soundRef = useRef(sound)
  soundRef.current = sound
  const [state, setState] = useState(() => initial(d))
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (state.status !== "running") return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      setState((s) => tick(s, t))
    }, 500)
    return () => clearInterval(id)
  }, [state.status])

  // done으로 바뀌는 순간 한 번만 알린다
  const phase = state.phase
  useEffect(() => {
    if (state.status !== "done") return
    if (soundRef.current) void new Audio("/ding.wav").play().catch(() => {})
    if (isTauri())
      void notify(
        phase === "focus"
          ? "집중 끝! 휴식할 시간이에요"
          : "휴식 끝! 다시 집중할 시간이에요",
      ).catch(() => {})
  }, [state.status, phase])

  const act = useCallback(
    (f: (s: PomoState, t: number) => PomoState) => {
      const t = Date.now()
      setNow(t)
      setState((s) => f(s, t))
    },
    [],
  )

  return {
    state,
    remainingMs: remaining(state, now),
    start: () => act(start),
    pause: () => act(pause),
    reset: () => act((s) => reset(s, dRef.current)),
    skip: () => act((s) => next(s, dRef.current)),
    next: () => act((s) => next(s, dRef.current)),
    longBreakEvery,
  }
}
