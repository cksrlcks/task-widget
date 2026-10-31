import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { LoginScreen } from "@/features/auth/LoginScreen"
import { runBoot, useAuth } from "@/features/auth/useAuth"
import { SettingsView } from "@/features/settings/SettingsView"
import { isTauri } from "@/features/shell/platform"
import { useUpdateCheck } from "@/features/update/useUpdateCheck"
import { TopBar } from "@/features/widget/TopBar"
import { useFitWindowHeight } from "@/features/widget/useFitWindowHeight"
import { Widget } from "@/features/widget/Widget"
import { WidgetCard } from "@/features/widget/WidgetCard"
import { cn } from "@/lib/utils"

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

/** 트레이 메뉴의 "설정"이 위젯에 보내는 이벤트 */
function useTraySettings(open: () => void) {
  useEffect(() => {
    if (!isTauri()) return
    const off = import("@tauri-apps/api/event").then(({ listen }) =>
      listen("open-settings", open),
    )
    return () => void off.then((f) => f())
  }, [open])
}

const web = !isTauri()

/** 투명 창. 카드만 떠 있고, 마우스를 올리면 카드 뒤로 이어진 배경이 나타난다. 웹은 가운데 한 열로 늘 배경을 보인다 */
export default function App() {
  const { update, installing, install } = useUpdateCheck()
  const [settings, setSettings] = useState(false)
  const { user } = useAuth()
  useTraySettings(useCallback(() => setSettings(true), []))
  const contentRef = useRef<HTMLDivElement>(null)
  // 헤더(h-9 = 36px) + 아래 여백(pb-2 = 8px)
  // 설정 화면은 창 크기를 그대로 두고 안에서 스크롤한다
  useFitWindowHeight(contentRef, 44, !settings)
  // 로그아웃하면 위젯(로그인) 화면으로
  useEffect(() => {
    if (!user) setSettings(false)
  }, [user])
  return (
    <div
      className={cn(
        "group/widget relative h-screen select-none",
        web && "mx-auto max-w-md",
      )}
      onMouseDown={startDrag}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl border border-black/[.06] bg-[#eeeeee]/95 opacity-0 transition-opacity duration-150 group-hover/widget:opacity-100 dark:border-white/[.08] dark:bg-[#1c1c1c]/95",
          // 설정 화면은 투명해지지 않는다
          settings && "opacity-100",
          web && "rounded-none border-y-0 opacity-100",
        )}
      />
      <div className="relative flex h-full flex-col">
        <TopBar
          settings={settings}
          onSettings={() => setSettings(true)}
          onBack={() => setSettings(false)}
          update={
            update
              ? {
                  version: update.version,
                  installing,
                  install: () => void install(),
                }
              : undefined
          }
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <div ref={contentRef} className="flex flex-col gap-2">
            {settings ? <SettingsView /> : <Body />}
          </div>
        </div>
      </div>
    </div>
  )
}
