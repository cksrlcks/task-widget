import { Button } from "@/components/ui/button"
import { LoginScreen } from "@/features/auth/LoginScreen"
import { runBoot, useAuth } from "@/features/auth/useAuth"
import { useAppPrefs } from "@/features/settings/appPrefs"
import { useUpdateCheck } from "@/features/update/useUpdateCheck"
import { TopBar } from "@/features/widget/TopBar"
import { Widget } from "@/features/widget/Widget"
import { WidgetCard } from "@/features/widget/WidgetCard"

function Body() {
  const { status } = useAuth()
  if (status === "loading")
    return (
      <WidgetCard className="items-center p-6">
        <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </WidgetCard>
    )
  if (status === "offline")
    return (
      <WidgetCard className="items-center gap-3 p-6 text-sm">
        <p>서버에 연결할 수 없습니다.</p>
        <Button onClick={runBoot}>다시 시도</Button>
      </WidgetCard>
    )
  if (status !== "authed")
    return (
      <WidgetCard className="min-h-0 overflow-y-auto">
        <LoginScreen />
      </WidgetCard>
    )
  return <Widget />
}

/** 투명 창. 카드만 떠 있고, 마우스를 올리면 카드 뒤로 이어진 배경이 나타난다 */
export default function App() {
  useUpdateCheck()
  const drag = useAppPrefs().anchor === "free" || undefined
  return (
    <div className="group/widget relative h-screen select-none">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl border border-black/[.06] bg-[#eeeeee]/95 opacity-0 transition-opacity duration-150 group-hover/widget:opacity-100 dark:border-white/[.08] dark:bg-[#1c1c1c]/95"
      />
      <TopBar />
      {/* 카드 사이 틈과 둘레는 자유 이동일 때 창을 끄는 손잡이 */}
      <div
        data-tauri-drag-region={drag}
        className="relative flex h-full flex-col gap-2 overflow-y-auto p-2 [&>:first-child_[data-slot=card-header]]:pr-16"
      >
        <Body />
      </div>
    </div>
  )
}
