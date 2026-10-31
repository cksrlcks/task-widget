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
/** 높이를 정하지 않았을 때. 할 일은 목록이 길어져도 이 높이 안에서 스크롤한다 */
const DEFAULT_HEIGHT: Partial<Record<SectionId, number>> = { todos: 260 }

/** 섹션 아래 경계. 끌거나 화살표 키로 바로 위 섹션의 높이만 바꾸고, 두 번 누르면 원래 크기로 */
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

/**
 * 섹션을 정한 순서로 쌓는다. 각 섹션은 자기 높이만 갖고(경계를 끌어 바꿈) 서로 영향을 주지 않는다.
 * 데스크톱 창 높이는 App이 내용 높이에 맞춘다
 */
export function Widget() {
  const {
    showPomodoro,
    showTodos,
    showCalendar,
    sectionHeights,
    sectionOrder,
    calendarExpanded,
  } = useAppPrefs()
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
  )
    .filter(([, show]) => show)
    .sort(([a], [b]) => sectionOrder.indexOf(a) - sectionOrder.indexOf(b))

  if (!items.length)
    return (
      <WidgetCard className="items-center p-6 text-sm text-muted-foreground">
        설정에서 표시할 항목을 켜 주세요
      </WidgetCard>
    )

  // 접힌 캘린더(오늘 일정)는 늘 내용 높이. 정한 높이는 펼친 달력에만 쓴다
  const fixed = (id: SectionId) => id !== "calendar" || calendarExpanded
  const heightOf = (id: SectionId) =>
    !fixed(id)
      ? undefined
      : live?.id === id
        ? live.h
        : (sectionHeights[id] ?? DEFAULT_HEIGHT[id])

  const resizer = (id: SectionId) => {
    let start: number | null = null
    return {
      onResize: (dy: number, done: boolean) => {
        start ??=
          document.querySelector<HTMLElement>(`[data-section="${id}"]`)
            ?.offsetHeight ?? MIN
        const h = Math.max(MIN, Math.round(start + dy))
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
  for (const [id, , render] of items) {
    const h = heightOf(id)
    out.push(
      <div
        key={id}
        data-section={id}
        className="flex shrink-0 flex-col"
        style={h ? { height: h } : undefined}
      >
        {/* 할 일은 목록만 스크롤하고, 높이를 줄인 다른 카드는 카드째 스크롤한다 */}
        {render(
          id === "todos"
            ? "min-h-0 flex-1"
            : h
              ? "min-h-0 flex-1 overflow-y-auto"
              : "",
        )}
      </div>,
      fixed(id) && <Divider key={`d-${id}`} {...resizer(id)} />,
    )
  }
  return <>{out}</>
}
