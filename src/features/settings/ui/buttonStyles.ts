import { cn } from "cn"

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
