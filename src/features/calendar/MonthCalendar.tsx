import { cn } from "@/lib/utils"
import { DOW } from "./constants"
import { monthGrid } from "./monthGrid"

type Props = {
  y: number
  m: number
  today: string
  selected: string | null
  /** 일정이 있는 날(점 표시) */
  withEvents: Set<string>
  onDayClick: (ymd: string, inMonth: boolean) => void
}

/** 요일 머리줄 + 날짜 칸 */
export function MonthCalendar({
  y,
  m,
  today,
  selected,
  withEvents,
  onDayClick,
}: Props) {
  return (
    <div className="grid grid-cols-7 px-1.5 pb-1.5 text-center text-xs">
      {DOW.map((d, i) => (
        <span
          key={d}
          className={cn(
            "pb-1 text-2xs text-muted-foreground",
            i === 0 && "text-destructive/70",
          )}
        >
          {d}
        </span>
      ))}
      {monthGrid(y, m).map(({ ymd, inMonth }) => (
        <button
          key={ymd}
          type="button"
          aria-label={`${Number(ymd.slice(0, 4))}년 ${Number(ymd.slice(5, 7))}월 ${Number(ymd.slice(8))}일`}
          aria-current={ymd === today ? "date" : undefined}
          aria-pressed={selected === ymd}
          onClick={() => onDayClick(ymd, inMonth)}
          className="group/day flex h-8 items-center justify-center outline-none"
        >
          <span
            className={cn(
              "relative flex size-7 items-center justify-center rounded-full tabular-nums group-hover/day:bg-muted group-focus-visible/day:ring-2 group-focus-visible/day:ring-primary/40",
              !inMonth && "text-muted-foreground/50",
              selected === ymd &&
                "bg-accent ring-1 ring-primary group-hover/day:bg-accent",
              ymd === today &&
                "bg-primary font-semibold text-primary-foreground group-hover/day:bg-primary-hover",
            )}
          >
            {Number(ymd.slice(8))}
            {withEvents.has(ymd) && (
              <span
                className={cn(
                  "absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full",
                  ymd === today ? "bg-primary-foreground" : "bg-primary",
                )}
              />
            )}
          </span>
        </button>
      ))}
    </div>
  )
}
