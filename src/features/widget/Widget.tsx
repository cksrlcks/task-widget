import { PomodoroSection } from "@/features/pomodoro/PomodoroSection"
import { useAppPrefs } from "@/features/settings/appPrefs"

// Task 7/8에서 TodoSection·CalendarSection을, Task 9에서 상단 바를 추가한다
export function Widget() {
  const { showPomodoro } = useAppPrefs()
  return <div className="flex flex-col gap-2">{showPomodoro && <PomodoroSection />}</div>
}
