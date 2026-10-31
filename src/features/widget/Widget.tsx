import { CalendarSection } from "@/features/calendar/CalendarSection"
import { PomodoroSection } from "@/features/pomodoro/PomodoroSection"
import { useAppPrefs } from "@/features/settings/appPrefs"
import { TodoSection } from "@/features/todos/TodoSection"

export function Widget() {
  const { showPomodoro, showTodos, showCalendar } = useAppPrefs()
  if (!showPomodoro && !showTodos && !showCalendar)
    return (
      <p className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        설정에서 표시할 항목을 켜 주세요
      </p>
    )
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {showPomodoro && <PomodoroSection />}
      {showTodos && <TodoSection className="min-h-0 flex-1" />}
      {showCalendar && <CalendarSection />}
    </div>
  )
}
