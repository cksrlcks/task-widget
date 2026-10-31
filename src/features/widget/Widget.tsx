import {
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
import { CalendarSection } from "@/features/calendar/CalendarSection"
import { PomodoroSection } from "@/features/pomodoro/PomodoroSection"
import {
  setPrefs,
  useAppPrefs,
  type SectionId,
} from "@/features/settings/appPrefs"
import { TodoSection } from "@/features/todos/TodoSection"
import { WidgetCard } from "./WidgetCard"

const MIN = 48

/** 섹션 사이 경계. 끌거나 화살표 키로 높이를 바꾸고, 두 번 누르면 원래 크기로 */
function Divider({
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

export function Widget() {
  const { showPomodoro, showTodos, showCalendar, sectionHeights } =
    useAppPrefs()
  // 끄는 동안은 화면에만 반영하고 놓을 때 저장한다
  const [live, setLive] = useState<{ id: SectionId; h: number } | null>(null)

  const items = (
    [
      [
        "pomodoro",
        showPomodoro,
        (c: string) => <PomodoroSection className={c} />,
      ],
      ["todos", showTodos, (c: string) => <TodoSection className={c} />],
      [
        "calendar",
        showCalendar,
        (c: string) => <CalendarSection className={c} />,
      ],
    ] as const
  ).filter(([, show]) => show)

  if (!items.length)
    return (
      <WidgetCard className="items-center p-6 text-sm text-muted-foreground">
        설정에서 표시할 항목을 켜 주세요
      </WidgetCard>
    )

  // 남는 공간을 채우는 섹션: 할 일, 없으면 마지막
  const filler =
    items.find(([id]) => id === "todos")?.[0] ?? items[items.length - 1][0]
  const heightOf = (id: SectionId) =>
    live?.id === id ? live.h : sectionHeights[id]

  // 경계 위아래 중 채우는 섹션이 아닌 쪽의 높이를 바꾼다
  const between = (upper: SectionId, lower: SectionId) =>
    upper === filler ? resizer(lower, -1) : resizer(upper, 1)

  /** id 섹션의 높이를 끈 거리만큼(sign: 아래로 끌면 +1 커짐, -1 작아짐) 바꾼다 */
  const resizer = (id: SectionId, sign: 1 | -1) => {
    let start: number | null = null
    return {
      onResize: (dy: number, done: boolean) => {
        start ??=
          document.querySelector<HTMLElement>(`[data-section="${id}"]`)
            ?.offsetHeight ?? MIN
        const h = Math.max(MIN, Math.round(start + sign * dy))
        if (!done) return setLive({ id, h })
        setLive(null)
        start = null
        setPrefs({ sectionHeights: { ...sectionHeights, [id]: h } })
      },
      onReset: () => {
        const { [id]: _, ...rest } = sectionHeights
        setPrefs({ sectionHeights: rest })
      },
    }
  }

  const out: ReactNode[] = []
  items.forEach(([id, , render], i) => {
    if (i > 0)
      out.push(<Divider key={`d-${id}`} {...between(items[i - 1][0], id)} />)
    const h = id === filler ? undefined : heightOf(id)
    out.push(
      <div
        key={id}
        data-section={id}
        className={
          id === filler
            ? "flex min-h-24 flex-1 flex-col"
            : "flex shrink-0 flex-col"
        }
        style={h ? { height: h } : undefined}
      >
        {/* 할 일은 목록만 스크롤하고, 높이를 줄인 다른 카드는 카드째 스크롤한다 */}
        {render(
          id === "todos"
            ? "min-h-0 flex-1"
            : h || id === filler
              ? "min-h-0 flex-1 overflow-y-auto"
              : "",
        )}
      </div>,
    )
  })
  // 마지막 섹션은 아래 가장자리로도 줄이고 늘린다
  const last = items[items.length - 1][0]
  if (last !== filler) out.push(<Divider key="d-end" {...resizer(last, 1)} />)
  return <>{out}</>
}
