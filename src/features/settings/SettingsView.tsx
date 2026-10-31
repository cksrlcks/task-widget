import { useAuth } from "@/features/auth/useAuth"
import { WidgetCard } from "@/features/widget/WidgetCard"
import { AccountPage } from "./pages/AccountPage"
import { GeneralPage } from "./pages/GeneralPage"
import { PomodoroPage } from "./pages/PomodoroPage"
import { SectionsPage } from "./pages/SectionsPage"

/** 위젯 안에서 여는 설정. 뒤로 가기는 위젯 헤더(TopBar)에 있다 */
export function SettingsView() {
  const { user } = useAuth()
  return (
    <>
      {[
        GeneralPage,
        SectionsPage,
        PomodoroPage,
        ...(user ? [AccountPage] : []),
      ].map((Page) => (
        <WidgetCard key={Page.name} className="shrink-0 px-3 py-2.5">
          <Page />
        </WidgetCard>
      ))}
    </>
  )
}
