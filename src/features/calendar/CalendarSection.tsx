import { useEffect, useRef, useState } from "react"
import {
  IconCalendarMonth,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { WidgetCard } from "@/features/widget/WidgetCard"
import { cn } from "@/lib/utils"
import { dayLabel, DayPanel } from "./DayPanel"
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
  // 기본은 오늘 일정만. 달력 보기를 누르면 월간 달력이 펼쳐진다
  const [expanded, setExpanded] = useState(false)
  const cardRef = useRef<HTMLElement>(null)
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(5))
  const { data = [], isLoading, isError } = useMonthEvents(ym)
  const today = useToday()
  const withEvents = new Set(data.map((e) => e.date))

  const move = (delta: number) => {
    setYm(shiftMonth(ym, delta))
    setSelected(null)
  }

  const thisMonth = today.slice(0, 7)
  const toggle = (
    <Button
      variant="ghost"
      size="xs"
      aria-expanded={expanded}
      onClick={() => {
        setExpanded(!expanded)
        setYm(thisMonth)
        setSelected(null)
      }}
    >
      {expanded ? <IconChevronUp /> : <IconCalendarMonth />}
      {expanded ? "접기" : "달력 보기"}
    </Button>
  )

  if (!expanded)
    return (
      <WidgetCard
        ref={cardRef}
        className={className}
        title={`오늘 · ${dayLabel(today)}`}
        action={toggle}
      >
        <DayPanel
          ymd={today}
          events={data}
          dialogContainer={cardRef}
          hideLabel
          className="border-t-0 pt-0"
        />
      </WidgetCard>
    )

  return (
    <WidgetCard
      ref={cardRef}
      className={className}
      title={`${y}년 ${m}월`}
      action={
        <>
          {toggle}
          {ym !== thisMonth && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setYm(thisMonth)
                setSelected(today)
              }}
            >
              오늘
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="이전 달"
            title="이전 달"
            onClick={() => move(-1)}
          >
            <IconChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="다음 달"
            title="다음 달"
            onClick={() => move(1)}
          >
            <IconChevronRight />
          </Button>
        </>
      }
    >
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
            onClick={() => {
              // 다른 달 칸은 그 달로 이동한 뒤 선택 (데이터가 그 달 기준이므로)
              if (!inMonth) setYm(ymd.slice(0, 7))
              setSelected(inMonth && selected === ymd ? null : ymd)
            }}
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
      {(isLoading || isError) && (
        <p className="pb-2 text-center text-xs text-muted-foreground">
          {isLoading ? "불러오는 중..." : "일정을 불러오지 못했습니다."}
        </p>
      )}
      {selected && (
        <DayPanel ymd={selected} events={data} dialogContainer={cardRef} />
      )}
    </WidgetCard>
  )
}
