import { useEffect, type RefObject } from "react"
import { getPrefs } from "@/features/settings/appPrefs"
import { isTauri } from "@/features/shell/platform"
import { MARGIN } from "./windowPos"

/**
 * 데스크톱: 창 높이를 내용 높이(CSS px, extra는 헤더·여백)에 맞춘다.
 * 창 아래쪽이 화면 작업 영역을 넘지 않게 그만큼만 늘리고 나머지는 스크롤한다. enabled가 false면 손대지 않는다
 */
export function useFitWindowHeight(
  ref: RefObject<HTMLElement | null>,
  extra: number,
  enabled = true,
) {
  useEffect(() => {
    const el = ref.current
    if (!isTauri() || !el || !enabled) return
    let busy = false
    let again = false
    const fit = async () => {
      if (busy) return void (again = true)
      busy = true
      try {
        const { getCurrentWindow, currentMonitor, PhysicalSize } =
          await import("@tauri-apps/api/window")
        const w = getCurrentWindow()
        const scale = await w.scaleFactor()
        const size = await w.innerSize()
        const m = await currentMonitor()
        const top = (await w.outerPosition()).y
        const max = m
          ? m.workArea.position.y +
            m.workArea.size.height -
            MARGIN * scale -
            top
          : Infinity
        const want = Math.min(
          max,
          Math.ceil((el.offsetHeight + extra) * scale * getPrefs().zoom),
        )
        if (Math.abs(want - size.height) > 1)
          await w.setSize(new PhysicalSize(size.width, want))
      } catch (err) {
        console.error("fit window failed", err)
      } finally {
        busy = false
        if (again) {
          again = false
          void fit()
        }
      }
    }
    const ro = new ResizeObserver(() => void fit())
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, extra, enabled])
}
