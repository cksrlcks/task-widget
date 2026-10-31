import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = {
  title?: ReactNode
  /** 제목 오른쪽 버튼 */
  action?: ReactNode
  className?: string
  children: ReactNode
}

/** 위젯 안의 카드 한 장 */
export function WidgetCard({ title, action, className, children }: Props) {
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
          className="flex h-9 shrink-0 items-center gap-1 pr-1.5 pl-3"
        >
          <h2
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
