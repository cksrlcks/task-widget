import type { ReactNode } from "react"
import { useAppPrefs } from "@/features/settings/appPrefs"
import { cn } from "@/lib/utils"

type Props = {
  title?: ReactNode
  /** 제목 오른쪽 버튼 */
  action?: ReactNode
  className?: string
  children: ReactNode
}

/** 위젯 안의 카드 한 장. 제목줄은 자유 이동일 때 끌어서 창을 옮기는 손잡이도 된다 */
export function WidgetCard({ title, action, className, children }: Props) {
  const drag = useAppPrefs().anchor === "free" || undefined
  return (
    <section
      className={cn(
        "flex flex-col rounded-lg border border-black/[.06] bg-card text-card-foreground shadow-[0_1px_3px_rgb(0_0_0/.08)] dark:border-white/[.08]",
        className,
      )}
    >
      {(title || action) && (
        <header
          data-slot="card-header"
          data-tauri-drag-region={drag}
          className="flex h-9 shrink-0 items-center gap-1 pr-1.5 pl-3"
        >
          <h2
            data-tauri-drag-region={drag}
            className="flex-1 text-xs font-semibold text-muted-foreground"
          >
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
