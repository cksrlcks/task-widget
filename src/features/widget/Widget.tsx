import { useState, type ReactNode } from "react"
import { CalendarSection } from "@/features/calendar/CalendarSection"
import { ClipboardSection } from "@/features/clipboard/ClipboardSection"
import { PomodoroSection } from "@/features/pomodoro/PomodoroSection"
import {
  setPrefs,
  useAppPrefs,
  type SectionId,
} from "@/features/settings/appPrefs"
import { isTauri } from "@/features/shell/platform"
import { TodoSection } from "@/features/todos/TodoSection"
import { SectionDivider } from "./SectionDivider"
import { WidgetCard } from "./WidgetCard"

const MIN = 48
/**
 * 목록 섹션: 내용만큼 늘다가 최대 높이(끌어 정한 높이, 없으면 이 값)를 넘으면 목록만 스크롤한다
 */
const LIST_MAX: Partial<Record<SectionId, number>> = {
  todos: 400,
  clipboard: 300,
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
    showClipboard,
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
      // 클립보드 감시는 데스크톱 앱만 할 수 있다
      [
        "clipboard",
        showClipboard && isTauri(),
        (c: string) => <ClipboardSection className={c} />,
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
        : (sectionHeights[id] ?? LIST_MAX[id])

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
    const list = id in LIST_MAX
    out.push(
      <div
        key={id}
        data-section={id}
        className="flex shrink-0 flex-col"
        style={h ? (list ? { maxHeight: h } : { height: h }) : undefined}
      >
        {/* 목록 섹션은 목록만 스크롤하고, 높이를 줄인 다른 카드는 카드째 스크롤한다 */}
        {render(
          list
            ? "min-h-0 flex-1"
            : h
              ? "min-h-0 flex-1 overflow-y-auto"
              : "",
        )}
      </div>,
      fixed(id) && <SectionDivider key={`d-${id}`} {...resizer(id)} />,
    )
  }
  return <>{out}</>
}
