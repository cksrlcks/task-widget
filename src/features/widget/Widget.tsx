import { CalendarSection } from "@/features/calendar/CalendarSection"
import { PomodoroSection } from "@/features/pomodoro/PomodoroSection"
import { useAppPrefs } from "@/features/settings/appPrefs"
import { TodoSection } from "@/features/todos/TodoSection"
import { WidgetCard } from "./WidgetCard"

export function Widget() {
  const { showPomodoro, showTodos, showCalendar } = useAppPrefs()
  if (!showPomodoro && !showTodos && !showCalendar)
    return (
      <WidgetCard className="items-center p-6 text-sm text-muted-foreground">
        설정에서 표시할 항목을 켜 주세요
      </WidgetCard>
    )
  return (
    <>
      {showPomodoro && <PomodoroSection className="shrink-0" />}
      {showTodos && <TodoSection className="min-h-40 flex-1" />}
      {showCalendar && <CalendarSection className="shrink-0" />}
    </>
  )
}
