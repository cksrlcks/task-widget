import { useCallback, useEffect, useRef, useState } from "react"
import { useAppPrefs } from "@/features/settings/appPrefs"
import { isTauri } from "@/features/shell/platform"
import {
  initial,
  pause,
  remaining,
  reset,
  setDuration,
  start,
  syncIdle,
  tick,
  type PomoState,
} from "./pomodoro"

async function notify(body: string) {
  if (!isTauri()) {
    // 웹: 브라우저 알림. 권한은 처음 한 번 묻는다
    if (!("Notification" in window)) return
    if (Notification.permission === "default")
      await Notification.requestPermission()
    if (Notification.permission === "granted")
      new Notification("뽀모도로", { body })
    return
  }
  const n = await import("@tauri-apps/plugin-notification")
  // 권한이 없으면 처음 한 번 요청한다
  if (!(await n.isPermissionGranted())) {
    if ((await n.requestPermission()) !== "granted") return
  }
  n.sendNotification({ title: "뽀모도로", body })
}

export function usePomodoro() {
  const { focusMin, sound } = useAppPrefs()
  const soundRef = useRef(sound)
  soundRef.current = sound
  const [state, setState] = useState(() => initial(focusMin))
  const [now, setNow] = useState(() => Date.now())

  // 설정에서 기본 시간을 바꾸면 시작 전 상태에 바로 반영한다
  useEffect(() => {
    setState((s) => syncIdle(s, focusMin))
  }, [focusMin])

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
  useEffect(() => {
    if (state.status !== "done") return
    if (soundRef.current) void new Audio("/ding.wav").play().catch(() => {})
    void notify("타이머가 끝났어요").catch(() => {})
  }, [state.status])

  const act = useCallback((f: (s: PomoState, t: number) => PomoState) => {
    const t = Date.now()
    setNow(t)
    setState((s) => f(s, t))
  }, [])

  return {
    state,
    remainingMs: remaining(state, now),
    start: () => act(start),
    pause: () => act(pause),
    reset: () => act(reset),
    setMinutes: (m: number) => act((s) => setDuration(s, m * 60_000)),
  }
}
