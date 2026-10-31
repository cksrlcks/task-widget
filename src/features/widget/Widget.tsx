import { PomodoroSection } from "@/features/pomodoro/PomodoroSection"
import { useAppPrefs } from "@/features/settings/appPrefs"
import { TodoSection } from "@/features/todos/TodoSection"

// Task 8에서 CalendarSection을, Task 9에서 상단 바를 추가한다
export function Widget() {
  const { showPomodoro, showTodos } = useAppPrefs()
  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {showPomodoro && <PomodoroSection />}
      {showTodos && <TodoSection className="min-h-0 flex-1" />}
    </div>
  )
}
