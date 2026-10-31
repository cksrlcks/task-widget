import { Button } from "@/components/ui/button"
import { Widget } from "@/features/widget/Widget"
import { WidgetCard } from "@/features/widget/WidgetCard"
import { LoginScreen } from "./LoginScreen"
import { runBoot, useAuth } from "./useAuth"

/** 로그인 상태에 따라 로딩·오프라인·로그인 화면 또는 위젯을 보인다 */
export function AuthGate() {
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
