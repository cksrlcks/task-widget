import { useCallback, useEffect, useRef, useState } from "react"
import { AuthGate } from "@/features/auth/AuthGate"
import { useAuth } from "@/features/auth/useAuth"
import { SettingsView } from "@/features/settings/SettingsView"
import { isTauri } from "@/features/shell/platform"
import { startDrag } from "@/features/shell/startDrag"
import { useTraySettings } from "@/features/shell/useTraySettings"
import { useUpdateCheck } from "@/features/update/useUpdateCheck"
import { TopBar } from "@/features/widget/TopBar"
import { useFitWindowHeight } from "@/features/widget/useFitWindowHeight"
import { cn } from "@/lib/utils"

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
            {settings ? <SettingsView /> : <AuthGate />}
          </div>
        </div>
      </div>
    </div>
  )
}
