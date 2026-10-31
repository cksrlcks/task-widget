import type { Monitor } from "@tauri-apps/api/window"
import { load, type Store } from "@tauri-apps/plugin-store"

// 모니터·저장 rect·setPosition/setSize 모두 물리 픽셀. prefs 너비(논리 px)는 모니터 scaleFactor를 곱해 넘긴다
export type Rect = { x: number; y: number; width: number; height: number }

const BAR = 32

/** 작업 영역 오른쪽 끝, 높이 = 작업 영역 높이 */
export function defaultRect(work: Rect, width: number): Rect {
  return {
    x: work.x + work.width - width,
    y: work.y,
    width,
    height: work.height,
  }
}

/** 상단 바(위 32px) 중심점이 m 안에 있나 */
export function barInside(r: Rect, m: Rect) {
  const cx = r.x + r.width / 2
  const cy = r.y + BAR / 2
  return cx >= m.x && cx < m.x + m.width && cy >= m.y && cy < m.y + m.height
}

/** 저장된 rect가 연결된 모니터 안이면 유지(너비만 prefs), 아니면 주 모니터 기본 위치 */
export function clampToMonitors(
  saved: Rect | null,
  monitors: Rect[],
  primaryWork: Rect,
  width: number,
): Rect {
  if (saved && monitors.some((m) => barInside(saved, m)))
    return { ...saved, width }
  return defaultRect(primaryWork, width)
}

const workRect = (m: Monitor): Rect => ({
  ...m.workArea.position,
  ...m.workArea.size,
})

/** 위젯 창 시작: 저장 위치 복원 → show, 이동·크기 변경을 500ms 모아 window.json에 저장 */
export async function initWindow(width: number) {
  const {
    availableMonitors,
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
      const home =
        (saved && mons.find((m) => barInside(saved, workRect(m)))) || primary
      const r = clampToMonitors(
        saved,
        mons.map(workRect),
        workRect(primary),
        Math.round(width * home.scaleFactor),
      )
      await w.setPosition(new PhysicalPosition(r.x, r.y))
      await w.setSize(new PhysicalSize(r.width, r.height))
    }
  } finally {
    // 위치를 못 잡아도 창은 띄운다
    await w.show()
  }
  let timer: ReturnType<typeof setTimeout> | undefined
  const save = () => {
    clearTimeout(timer)
    timer = setTimeout(async () => {
      if (await w.isMinimized()) return
      const [p, s] = await Promise.all([w.outerPosition(), w.outerSize()])
      await store.set("rect", {
        x: p.x,
        y: p.y,
        width: s.width,
        height: s.height,
      } satisfies Rect)
      await store.save()
    }, 500)
  }
  await w.onMoved(save)
  await w.onResized(save)
}
