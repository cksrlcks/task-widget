import { useEffect } from "react"
import { isTauri } from "./platform"

/** 트레이 메뉴의 "설정"이 위젯에 보내는 이벤트 */
export function useTraySettings(open: () => void) {
  useEffect(() => {
    if (!isTauri()) return
    const off = import("@tauri-apps/api/event").then(({ listen }) =>
      listen("open-settings", open),
    )
    return () => void off.then((f) => f())
  }, [open])
}
