import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/useAuth"
import { WidgetCard } from "@/features/widget/WidgetCard"
import { AccountPage } from "./pages/AccountPage"
import { GeneralPage } from "./pages/GeneralPage"
import { PomodoroPage } from "./pages/PomodoroPage"
import { SectionsPage } from "./pages/SectionsPage"

type Props = { onBack: () => void }

/** 위젯 안에서 여는 설정. 뒤로 가기로 위젯 화면에 돌아간다 */
export function SettingsView({ onBack }: Props) {
  const { user } = useAuth()
  return (
    <>
      <header className="flex h-9 shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="뒤로"
          title="뒤로"
          onClick={onBack}
        >
          <IconArrowLeft />
        </Button>
        <h1 className="text-sm font-semibold">설정</h1>
      </header>
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
