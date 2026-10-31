import type { ReactNode } from "react"
import { cn } from "cn"

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
