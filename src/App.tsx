import { Button } from "@/components/ui/button"
import { LoginScreen } from "@/features/auth/LoginScreen"
import { runBoot, useAuth } from "@/features/auth/useAuth"
import { isTauri } from "@/features/shell/platform"
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

// 누르면 동작하는 것들. 이 밖의 빈 곳(카드 여백·제목·시간 표시·카드 사이 틈)은 끌어서 창을 옮긴다
const INTERACTIVE =
  "button, input, textarea, select, a, label, [role=checkbox], [data-no-drag]"

const startDrag = (e: React.MouseEvent) => {
  const t = e.target as HTMLElement
  // 대화상자는 포털로 그려져 DOM상 바깥이지만 React 이벤트는 여기까지 올라온다
  if (e.button !== 0 || !isTauri() || !e.currentTarget.contains(t)) return
  if (t.closest(INTERACTIVE)) return
  void import("@tauri-apps/api/window").then(({ getCurrentWindow }) =>
    getCurrentWindow().startDragging(),
  )
}

/** 투명 창. 카드만 떠 있고, 마우스를 올리면 카드 뒤로 이어진 배경이 나타난다 */
export default function App() {
  useUpdateCheck()
  return (
    <div className="group/widget relative h-screen select-none" onMouseDown={startDrag}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl border border-black/[.06] bg-[#eeeeee]/95 opacity-0 transition-opacity duration-150 group-hover/widget:opacity-100 dark:border-white/[.08] dark:bg-[#1c1c1c]/95"
      />
      <TopBar />
      <div
        className="relative flex h-full flex-col gap-2 overflow-y-auto p-2 [&>:first-child_[data-slot=card-header]]:pr-16"
      >
        <Body />
      </div>
    </div>
  )
}
