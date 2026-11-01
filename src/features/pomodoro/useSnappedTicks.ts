import { useLayoutEffect, useRef, useState } from "react"
import { snapTicks } from "./barScale"

/** 막대 폭이 바뀔 때마다(창 크기·확대 배율) 화면 픽셀에 맞춘 눈금 크기를 다시 구한다 */
export function useSnappedTicks<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<ReturnType<typeof snapTicks> | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) =>
      setSize(snapTicks(e.contentRect.width, window.devicePixelRatio)),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, size] as const
}
