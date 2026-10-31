import { useState, type ComponentType } from "react"
import { cn } from "cn"
import { LayoutGrid, Settings, Timer, UserCircle } from "lucide-react"
import { AccountPage } from "./pages/AccountPage"
import { GeneralPage } from "./pages/GeneralPage"
import { PomodoroPage } from "./pages/PomodoroPage"
import { SectionsPage } from "./pages/SectionsPage"

type Page = "general" | "sections" | "pomodoro" | "account"
const PAGES: {
  id: Page
  label: string
  icon: ComponentType<{ className?: string }>
  View: ComponentType
}[] = [
  { id: "general", label: "일반", icon: Settings, View: GeneralPage },
  { id: "sections", label: "위젯 구성", icon: LayoutGrid, View: SectionsPage },
  { id: "pomodoro", label: "뽀모도로", icon: Timer, View: PomodoroPage },
  { id: "account", label: "내 계정", icon: UserCircle, View: AccountPage },
]

/** 설정 창: 왼쪽 탐색 + 오른쪽 항목 목록. 닫기는 창의 닫기 버튼으로 한다 */
export function SettingsWindow() {
  const [page, setPage] = useState<Page>("general")
  const current = PAGES.find((p) => p.id === page)!
  return (
    <div className="flex h-screen bg-background text-foreground">
      <nav className="flex w-[200px] shrink-0 flex-col border-r border-border bg-muted/40">
        <h1 className="px-5 pt-5 text-base font-semibold">설정</h1>
        <div className="flex flex-col gap-0.5 px-3 pt-5">
          {PAGES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setPage(id)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-lg px-2.5 text-left text-base outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-primary/40",
                page === id && "bg-accent font-medium hover:bg-accent",
              )}
            >
              <Icon className="size-[18px] text-foreground/80" />
              {label}
            </button>
          ))}
        </div>
      </nav>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-border px-8">
          <span className="text-sm text-muted-foreground">
            설정<span className="mx-2 text-foreground/25">/</span>
            <span className="text-foreground">{current.label}</span>
          </span>
        </header>
        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-8">
          <current.View />
        </div>
      </div>
    </div>
  )
}
