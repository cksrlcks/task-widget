import type { ReactNode } from "react"

export function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="mb-3 last:mb-0">
      <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
      <div className="divide-y divide-border">{children}</div>
    </section>
  )
}
