import { Button } from "@/components/ui/button"
import { LoginScreen } from "@/features/auth/LoginScreen"
import { runBoot, useAuth } from "@/features/auth/useAuth"
import { Widget } from "@/features/widget/Widget"

export default function App() {
  const { status } = useAuth()
  if (status === "loading")
    return (
      <div className="flex h-screen items-center justify-center">
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
