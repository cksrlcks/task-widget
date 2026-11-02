import { useSyncExternalStore } from "react"
import { getPrefs } from "@/features/settings/appPrefs"
import { isTauri } from "@/features/shell/platform"
import { addClip } from "./history"
import type { ClipItem } from "./type"

// 복사한 내용은 이 기기에만 둔다(서버로 보내지 않는다)
const KEY = "taskwidget.clipboard"

const isItem = (v: unknown): v is ClipItem => {
  const c = v as ClipItem | null
  return (
    typeof c?.id === "string" &&
    typeof c.text === "string" &&
    typeof c.pinned === "boolean"
  )
}

function load(): ClipItem[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]")
    return Array.isArray(v) ? v.filter(isItem) : []
  } catch {
    return []
  }
}

const listeners = new Set<() => void>()
let current = load()

function save(next: ClipItem[]) {
  current = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 저장 못 해도 이번 실행 동안은 유지된다
  }
  listeners.forEach((l) => l())
}

export function useClips(): ClipItem[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
  )
}

export const togglePin = (id: string) =>
  save(current.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
export const removeClip = (id: string) =>
  save(current.filter((c) => c.id !== id))
/** 고정 항목만 남긴다 */
export const clearClips = () => save(current.filter((c) => c.pinned))

/**
 * 데스크톱 시작 시 한 번. Rust가 알려 주는 새 복사 내용을 기록한다(섹션을 끄면 기록하지 않는다).
 * Windows는 시스템 기록(Win+V)을 읽으므로 이 이벤트가 오지 않는다
 */
export function initClipboard() {
  if (!isTauri()) return
  void import("@tauri-apps/api/event").then(({ listen }) =>
    listen<string>("clipboard-text", (e) => {
      if (getPrefs().showClipboard) save(addClip(current, e.payload))
    }),
  )
}
