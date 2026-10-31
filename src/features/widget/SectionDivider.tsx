import type { KeyboardEvent, PointerEvent } from "react"

/** 섹션 아래 경계. 끌거나 화살표 키로 바로 위 섹션의 높이만 바꾸고, 두 번 누르면 원래 크기로 */
export function SectionDivider({
  onResize,
  onReset,
}: {
  onResize: (dy: number, done: boolean) => void
  onReset: () => void
}) {
  const down = (e: PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const y0 = e.clientY
    const move = (ev: globalThis.PointerEvent) =>
      onResize(ev.clientY - y0, false)
    const up = (ev: globalThis.PointerEvent) => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      onResize(ev.clientY - y0, true)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }
  const key = (e: KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault()
      onResize(e.key === "ArrowUp" ? -16 : 16, true)
    }
  }
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="섹션 높이 조절"
      tabIndex={0}
      data-no-drag
      onPointerDown={down}
      onKeyDown={key}
      onDoubleClick={onReset}
      className="group/div relative -my-2 flex h-2 shrink-0 cursor-row-resize touch-none items-center justify-center outline-none"
    >
      <span className="h-1 w-8 rounded-full bg-foreground/0 transition-colors group-hover/div:bg-foreground/25 group-focus-visible/div:bg-primary" />
    </div>
  )
}
