import type { Monitor } from "@tauri-apps/api/window"
import { load, type Store } from "@tauri-apps/plugin-store"

// 모니터·저장 rect·setPosition/setSize 모두 물리 픽셀. 여백·기본 크기(논리 px)는 모니터 scaleFactor를 곱해 쓴다
export type Rect = { x: number; y: number; width: number; height: number }
export type Size = { width: number; height: number }
export type Anchor = "free" | "top-right" | "bottom-right"
export type Screen = { work: Rect; scale: number }

/** 화면 가장자리와 위젯 사이 여백(논리 px) */
export const MARGIN = 20
export const DEFAULT_SIZE: Size = { width: 360, height: 720 }

const BAR = 32

/** 작업 영역의 오른쪽 위/아래에 여백을 두고 붙인다. 크기는 작업 영역 안으로 줄인다 */
export function anchoredRect(
  work: Rect,
  size: Size,
  anchor: Exclude<Anchor, "free">,
  margin: number,
): Rect {
  const width = Math.min(size.width, work.width - 2 * margin)
  const height = Math.min(size.height, work.height - 2 * margin)
  return {
    x: work.x + work.width - width - margin,
    y:
      anchor === "top-right"
        ? work.y + margin
        : work.y + work.height - height - margin,
    width,
    height,
  }
}

/** 상단 바(위 32px) 중심점이 m 안에 있나 */
export function barInside(r: Rect, m: Rect) {
  const cx = r.x + r.width / 2
  const cy = r.y + BAR / 2
  return cx >= m.x && cx < m.x + m.width && cy >= m.y && cy < m.y + m.height
}

/** 시작 위치. 자유 이동이고 저장 위치가 연결된 화면 안이면 그대로, 아니면 고정 위치(자유 이동은 오른쪽 위) */
export function placeRect(
  saved: Rect | null,
  screens: Screen[],
  primary: Screen,
  anchor: Anchor,
): Rect {
  const found = saved ? screens.find((s) => barInside(saved, s.work)) : undefined
  const home = found ?? primary
  if (anchor === "free" && saved && found)
    return { ...saved, height: Math.min(saved.height, found.work.height) }
  const size = saved ?? {
    width: Math.round(DEFAULT_SIZE.width * home.scale),
    height: Math.round(DEFAULT_SIZE.height * home.scale),
  }
  return anchoredRect(
    home.work,
    size,
    anchor === "free" ? "top-right" : anchor,
    Math.round(MARGIN * home.scale),
  )
}

const screenOf = (m: Monitor): Screen => ({
  work: { ...m.workArea.position, ...m.workArea.size },
  scale: m.scaleFactor,
})

let snapNow: (() => void) | null = null
/** 위치 설정이 바뀌면 바로 다시 붙인다. 위젯 창이 아니면 아무 일도 안 한다 */
export const snapWindow = () => snapNow?.()

/** 위젯 창 시작: 위치 복원 → show. 이동·크기 변경이 멈추면 고정 위치에 다시 붙이고 window.json에 저장 */
export async function initWindow(getAnchor: () => Anchor) {
  const {
    availableMonitors,
    currentMonitor,
    getCurrentWindow,
    primaryMonitor,
    PhysicalPosition,
    PhysicalSize,
  } = await import("@tauri-apps/api/window")
  const w = getCurrentWindow()
  let store: Store
  try {
    store = await load("window.json")
    const saved = (await store.get<Rect>("rect")) ?? null
    const mons = await availableMonitors()
    const primary = (await primaryMonitor()) ?? mons[0]
    if (primary) {
      const r = placeRect(saved, mons.map(screenOf), screenOf(primary), getAnchor())
      await w.setPosition(new PhysicalPosition(r.x, r.y))
      await w.setSize(new PhysicalSize(r.width, r.height))
    }
  } finally {
    // 위치를 못 잡아도 창은 띄운다
    await w.show()
  }

  const snap = async () => {
    const anchor = getAnchor()
    if (anchor === "free") return
    const mon = await currentMonitor()
    if (!mon) return
    const s = screenOf(mon)
    const [p, size] = await Promise.all([w.outerPosition(), w.outerSize()])
    const r = anchoredRect(s.work, size, anchor, Math.round(MARGIN * s.scale))
    if (r.width !== size.width || r.height !== size.height)
      await w.setSize(new PhysicalSize(r.width, r.height))
    if (r.x !== p.x || r.y !== p.y)
      await w.setPosition(new PhysicalPosition(r.x, r.y))
  }
  snapNow = () => void snap().catch(console.error)

  // 드래그 중에는 건드리지 않고, 멈춘 뒤 한 번 붙이고 저장한다
  let timer: ReturnType<typeof setTimeout> | undefined
  const settle = () => {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      if (await w.isMinimized()) return
      await snap().catch(console.error)
      const [p, s] = await Promise.all([w.outerPosition(), w.outerSize()])
      await store.set("rect", {
        x: p.x,
        y: p.y,
        width: s.width,
        height: s.height,
      } satisfies Rect)
      await store.save()
    }, 400)
  }
  await w.onMoved(settle)
  await w.onResized(settle)
}
