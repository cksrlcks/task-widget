import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DayPanel } from "./DayPanel"
import { monthGrid, shiftMonth, toYmd } from "./monthGrid"
import { useMonthEvents } from "./queries"

const DOW = ["일", "월", "화", "수", "목", "금", "토"]

type Props = { className?: string }

/** 위젯을 며칠씩 켜 두므로 자정이 지나면 오늘 표시를 옮긴다 */
function useToday() {
  const [today, setToday] = useState(() => toYmd(new Date()))
  useEffect(() => {
    const update = () => setToday(toYmd(new Date()))
    const id = setInterval(update, 60_000)
    window.addEventListener("focus", update)
    return () => {
      clearInterval(id)
      window.removeEventListener("focus", update)
    }
  }, [])
  return today
}

export function CalendarSection({ className }: Props) {
  const [ym, setYm] = useState(() => toYmd(new Date()).slice(0, 7))
  const [selected, setSelected] = useState<string | null>(null)
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(5))
  const { data = [], isLoading, isError } = useMonthEvents(ym)
  const today = useToday()
  const withEvents = new Set(data.map((e) => e.date))

  const move = (delta: number) => {
    setYm(shiftMonth(ym, delta))
    setSelected(null)
  }

  return (
    <section className={cn("flex flex-col gap-2 p-3", className)}>
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-xs" aria-label="이전 달" onClick={() => move(-1)}>
          <IconChevronLeft />
        </Button>
        <span className="text-sm font-medium">
          {y}년 {m}월
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
        {monthGrid(y, m).map(({ ymd, inMonth }) => (
          <button
            key={ymd}
            type="button"
            aria-label={`${Number(ymd.slice(0, 4))}년 ${Number(ymd.slice(5, 7))}월 ${Number(ymd.slice(8))}일`}
            aria-current={ymd === today ? "date" : undefined}
            aria-pressed={selected === ymd}
            onClick={() => {
              // 다른 달 칸은 그 달로 이동한 뒤 선택 (데이터가 그 달 기준이므로)
              if (!inMonth) setYm(ymd.slice(0, 7))
              setSelected(inMonth && selected === ymd ? null : ymd)
            }}
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
