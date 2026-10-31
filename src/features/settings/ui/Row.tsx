import type { ReactNode } from "react"

export function Row({
  title,
  desc,
  children,
}: {
  title: string
  desc?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-2.5">
      <div className="flex min-w-[9rem] flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {desc && <span className="text-xs text-muted-foreground">{desc}</span>}
      </div>
      {children}
    </div>
  )
}
