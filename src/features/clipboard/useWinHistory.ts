import { useCallback, useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { toast } from "sonner"
import { toastClipError } from "./toastClipError"
import type { ClipItem, ClipList } from "./type"

const ERRORS: Record<string, string> = {
  disabled: "Windows 클립보드 기록이 꺼져 있어요. Win+V를 눌러 켜 주세요.",
  denied: "Windows 클립보드 기록을 읽을 권한이 없습니다.",
}

/** Windows 시스템 클립보드 기록(Win+V)을 읽고 쓴다. 클립보드가 바뀌거나 창이 포커스를 받으면 다시 읽는다 */
export function useWinHistory(): ClipList {
  const [clips, setClips] = useState<ClipItem[]>([])
  const [error, setError] = useState<string>()

  const refresh = useCallback(
    () =>
      invoke<{ id: string; text: string; image: string | null }[]>(
        "clipboard_history",
      ).then(
        (list) => {
          setClips(
            list.map((c) => ({
              ...c,
              image: c.image ?? undefined,
              pinned: false,
            })),
          )
          setError(undefined)
        },
        (err: unknown) =>
          setError(ERRORS[String(err)] ?? "클립보드 기록을 읽지 못했습니다."),
      ),
    [],
  )

  useEffect(() => {
    void refresh()
    // 기록은 클립보드가 바뀐 직후 조금 늦게 갱신된다
    let timer: ReturnType<typeof setTimeout> | undefined
    const off = listen("clipboard-changed", () => {
      clearTimeout(timer)
      timer = setTimeout(() => void refresh(), 300)
    })
    const onFocus = () => void refresh()
    window.addEventListener("focus", onFocus)
    return () => {
      clearTimeout(timer)
      void off.then((f) => f())
      window.removeEventListener("focus", onFocus)
    }
  }, [refresh])

  return {
    clips,
    error,
    canPin: false,
    copy: (c) =>
      void invoke("clipboard_history_use", { id: c.id }).then(
        () => toast.success("복사했어요"),
        toastClipError,
      ),
    remove: (c) =>
      void invoke("clipboard_history_delete", { id: c.id }).then(
        refresh,
        toastClipError,
      ),
    togglePin: () => {},
    clear: () =>
      void invoke("clipboard_history_clear").then(refresh, toastClipError),
    clearNote:
      "Windows 클립보드 기록(Win+V)이 지워집니다. Win+V에서 고정한 항목은 남습니다.",
  }
}
