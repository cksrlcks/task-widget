import type { ReactNode } from "react"
import { cn } from "cn"

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

export const Pill = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <span
    className={cn(
      "max-w-[60%] truncate rounded-full bg-muted px-2 py-1 text-xs font-semibold",
      className,
    )}
  >
    {children}
  </span>
)

export const btn =
  "h-8 shrink-0 rounded-[10px] border bg-card px-3 text-sm outline-none focus-visible:ring-2"
export const btnOutline = cn(
  btn,
  "border-border hover:bg-muted focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50",
)
export const btnDanger = cn(
  btn,
  "border-destructive text-destructive hover:bg-destructive/5 focus-visible:ring-destructive/40 disabled:pointer-events-none disabled:opacity-50",
)

/** 몇 개 중 하나 고르기(테마·배율·너비) */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange(v: T): void
  disabled?: boolean
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex shrink-0 rounded-[10px] bg-muted p-0.5",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            "h-7 rounded-[8px] px-2.5 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40",
            value === o.value &&
              "bg-card font-medium text-foreground shadow-sm",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
