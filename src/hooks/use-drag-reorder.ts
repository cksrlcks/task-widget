import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react"

/**
 * 세로 목록을 손잡이로 끌어 순서 바꾸기. 목록 요소에 listRef를, 옮길 수 있는 행에 data-reorder를 붙인다.
 * 끄는 행은 포인터를 따라가고 그 사이 행들은 한 칸씩 비켜 주며, 놓으면 onDrop(from, to)를 부른다
 */
export function useDragReorder<T extends HTMLElement>(
  onDrop: (from: number, to: number) => void,
) {
  const listRef = useRef<T>(null)
  const [drag, setDrag] = useState<{
    from: number
    to: number
    dy: number
    h: number
  } | null>(null)

  const grab = (from: number) => (e: ReactPointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const rows = [
      ...(listRef.current?.querySelectorAll<HTMLElement>("[data-reorder]") ??
        []),
    ]
    const mids = rows.map((r) => {
      const b = r.getBoundingClientRect()
      return b.top + b.height / 2
    })
    const h = rows[from].getBoundingClientRect().height
    const startY = e.clientY
    let to = from
    setDrag({ from, to, dy: 0, h })
    const onMove = (ev: PointerEvent) => {
      to = mids.filter((m, i) => i !== from && m < ev.clientY).length
      setDrag({ from, to, dy: ev.clientY - startY, h })
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      setDrag(null)
      if (to !== from) onDrop(from, to)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  const shift = (i: number): CSSProperties | undefined => {
    if (!drag) return
    const { from, to, dy, h } = drag
    if (i === from) return { transform: `translateY(${dy}px)` }
    if (from < i && i <= to) return { transform: `translateY(${-h}px)` }
    if (to <= i && i < from) return { transform: `translateY(${h}px)` }
  }

  return { listRef, grab, shift, dragging: drag?.from ?? null }
}
