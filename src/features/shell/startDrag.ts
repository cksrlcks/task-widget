import type { MouseEvent } from "react"
import { isTauri } from "./platform"

// 누르면 동작하는 것들. 이 밖의 빈 곳(카드 여백·제목·시간 표시·카드 사이 틈)은 끌어서 창을 옮긴다
const INTERACTIVE =
  "button, input, textarea, select, a, label, [role=checkbox], [data-no-drag]"

export const startDrag = (e: MouseEvent) => {
  const t = e.target as HTMLElement
  // 대화상자는 포털로 그려져 DOM상 바깥이지만 React 이벤트는 여기까지 올라온다
  if (e.button !== 0 || !isTauri() || !e.currentTarget.contains(t)) return
  if (t.closest(INTERACTIVE)) return
  void import("@tauri-apps/api/window").then(({ getCurrentWindow }) =>
    getCurrentWindow().startDragging(),
  )
}
