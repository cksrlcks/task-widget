import { useSyncExternalStore } from "react"
import { isTauri } from "@/features/shell/platform"
import type { Anchor } from "@/features/widget/windowPos"

export type Theme = "system" | "light" | "dark"

export type AppPrefs = {
  theme: Theme
  /** 화면 배율(1 = 100%) */
  zoom: 0.9 | 1 | 1.1 | 1.25
  /** 위젯 위치: 자유 이동 또는 오른쪽 위/아래 고정. 크기는 창 가장자리를 끌어 조절한다 */
  anchor: Anchor
  alwaysOnTop: boolean
  /** 창 닫기 = 트레이로 숨기기. 끄면 앱 종료 */
  closeToTray: boolean
  showPomodoro: boolean
  showTodos: boolean
  showCalendar: boolean
  focusMin: number
  shortBreakMin: number
  longBreakMin: number
  longBreakEvery: number
  sound: boolean
}

const KEY = "taskwidget.prefs"
export const DEFAULTS: AppPrefs = {
  theme: "system",
  zoom: 1,
  anchor: "top-right",
  alwaysOnTop: true,
  closeToTray: true,
  showPomodoro: true,
  showTodos: true,
  showCalendar: true,
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  longBreakEvery: 4,
  sound: true,
}
const THEMES: Theme[] = ["system", "light", "dark"]
const ZOOMS = [0.9, 1, 1.1, 1.25]
const ANCHORS: Anchor[] = ["free", "top-right", "bottom-right"]

const num = (v: unknown, min: number, max: number, def: number) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(min, v))
    : def
const oneOf = <T>(v: unknown, opts: T[], def: T) =>
  opts.includes(v as T) ? (v as T) : def
const bool = (v: unknown, def: boolean) => (typeof v === "boolean" ? v : def)

/** 저장된 문자열을 파싱해 기본값과 합치고 범위를 맞춘다. 순수 함수 */
export function loadPrefs(raw: string | null): AppPrefs {
  let s: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}")
    if (parsed && typeof parsed === "object")
      s = parsed as Record<string, unknown>
  } catch {
    // 깨진 저장값은 기본값으로
  }
  const d = DEFAULTS
  return {
    theme: oneOf(s.theme, THEMES, d.theme),
    zoom: oneOf(s.zoom, ZOOMS, d.zoom) as AppPrefs["zoom"],
    anchor: oneOf(s.anchor, ANCHORS, d.anchor),
    alwaysOnTop: bool(s.alwaysOnTop, d.alwaysOnTop),
    closeToTray: bool(s.closeToTray, d.closeToTray),
    showPomodoro: bool(s.showPomodoro, d.showPomodoro),
    showTodos: bool(s.showTodos, d.showTodos),
    showCalendar: bool(s.showCalendar, d.showCalendar),
    focusMin: num(s.focusMin, 1, 120, d.focusMin),
    shortBreakMin: num(s.shortBreakMin, 1, 120, d.shortBreakMin),
    longBreakMin: num(s.longBreakMin, 1, 120, d.longBreakMin),
    longBreakEvery: num(s.longBreakEvery, 1, 10, d.longBreakEvery),
    sound: bool(s.sound, d.sound),
  }
}

function load(): AppPrefs {
  try {
    return loadPrefs(localStorage.getItem(KEY))
  } catch {
    return DEFAULTS
  }
}

const listeners = new Set<() => void>()
let current = load()

export const getPrefs = () => current

export function setPrefs(patch: Partial<AppPrefs>) {
  // 다른 창이 바꾼 값을 덮어쓰지 않게 저장된 최신값에 덧붙인다
  current = loadPrefs(JSON.stringify({ ...load(), ...patch }))
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // 저장 못 해도 이번 실행 동안은 유지된다
  }
  apply(current)
  listeners.forEach((l) => l())
}

export function useAppPrefs(): AppPrefs {
  return useSyncExternalStore((l) => {
    listeners.add(l)
    return () => listeners.delete(l)
  }, getPrefs)
}

// 설정 창은 테마만 따른다(배율·창 속성은 위젯 창의 몫). initPrefs에서 정한다
let windowEffects = true

const darkQuery =
  typeof matchMedia === "undefined"
    ? null
    : matchMedia("(prefers-color-scheme: dark)")

/** 화면(테마·배율)과 Rust 쪽(창 속성)에 반영 */
function apply(p: AppPrefs) {
  document.documentElement.classList.toggle(
    "dark",
    p.theme === "dark" || (p.theme === "system" && !!darkQuery?.matches),
  )
  if (!isTauri() || !windowEffects) return
  void import("@tauri-apps/api/webview")
    .then(({ getCurrentWebview }) => getCurrentWebview().setZoom(p.zoom))
    .catch(() => {})
  void import("@tauri-apps/api/core")
    .then(({ invoke }) =>
      invoke("apply_window_prefs", {
        alwaysOnTop: p.alwaysOnTop,
        closeToTray: p.closeToTray,
      }),
    )
    .catch(() => {})
  void import("@/features/widget/windowPos").then((m) => m.snapWindow())
}

/** 앱 시작 시 한 번. 시스템 테마가 바뀌면 따라간다 */
export function initPrefs({ windowEffects: effects = true } = {}) {
  windowEffects = effects
  apply(current)
  darkQuery?.addEventListener("change", () => {
    if (current.theme === "system") apply(current)
  })
  // 다른 창에서 바꾼 설정을 바로 따른다
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return
    current = load()
    apply(current)
    listeners.forEach((l) => l())
  })
}
