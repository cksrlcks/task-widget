import { Button } from "@/components/ui/button"
import { LoginScreen } from "@/features/auth/LoginScreen"
import { runBoot, useAuth } from "@/features/auth/useAuth"
import { useAppPrefs } from "@/features/settings/appPrefs"
import { TopBar } from "@/features/widget/TopBar"
import { Widget } from "@/features/widget/Widget"

function Body() {
  const { status } = useAuth()
  if (status === "loading")
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      </div>
    )
  if (status === "offline")
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-sm">
        <p>서버에 연결할 수 없습니다.</p>
        <Button onClick={runBoot}>다시 시도</Button>
      </div>
    )
  return status === "authed" ? <Widget /> : <LoginScreen />
}

/** 투명 창 위에 둥근 배경을 직접 그린다. 투명도는 CSS opacity(글자가 흐려지지 않는다) */
export default function App() {
  const { opacity } = useAppPrefs()
  return (
    <div
      className="flex h-screen flex-col overflow-hidden rounded-lg border bg-background"
      style={{ opacity }}
    >
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        <Body />
      </div>
    </div>
  )
}
