import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DayPanel } from "./DayPanel"
import { monthGrid, toYmd } from "./monthGrid"
import { useMonthEvents } from "./queries"

const DOW = ["일", "월", "화", "수", "목", "금", "토"]

type Props = { className?: string }

export function CalendarSection({ className }: Props) {
  const now = new Date()
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 })
  const [selected, setSelected] = useState<string | null>(null)
  const ym = `${cursor.y}-${String(cursor.m).padStart(2, "0")}`
  const { data = [], isLoading, isError } = useMonthEvents(ym)
  const today = toYmd(new Date())
  const withEvents = new Set(data.map((e) => e.date))

  const move = (delta: number) => {
    const d = new Date(cursor.y, cursor.m - 1 + delta, 1)
    setCursor({ y: d.getFullYear(), m: d.getMonth() + 1 })
    setSelected(null)
  }

  return (
    <section className={cn("flex flex-col gap-2 p-3", className)}>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-xs" aria-label="이전 달" onClick={() => move(-1)}>
          <IconChevronLeft />
        </Button>
        <span className="text-sm font-medium">
          {cursor.y}년 {cursor.m}월
        </span>
        <Button variant="ghost" size="icon-xs" aria-label="다음 달" onClick={() => move(1)}>
          <IconChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
        {DOW.map((d) => (
          <span key={d} className="text-muted-foreground">
            {d}
          </span>
        ))}
        {monthGrid(cursor.y, cursor.m).map(({ ymd, inMonth }) => (
          <button
            key={ymd}
            type="button"
            aria-label={ymd}
            aria-pressed={selected === ymd}
            onClick={() => setSelected(selected === ymd ? null : ymd)}
            className={cn(
              "relative h-7 rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/40",
              !inMonth && "text-muted-foreground/50",
              ymd === today && "font-bold text-primary ring-1 ring-primary",
              selected === ymd && "bg-accent",
            )}
          >
            {Number(ymd.slice(8))}
            {withEvents.has(ymd) && (
              <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
      {(isLoading || isError) && (
        <p className="text-center text-xs text-muted-foreground">
          {isLoading ? "불러오는 중..." : "일정을 불러오지 못했습니다."}
        </p>
      )}
      {selected && <DayPanel ymd={selected} events={data} />}
    </section>
  )
}
