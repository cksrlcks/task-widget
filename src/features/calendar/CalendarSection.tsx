import { useState } from "react"
import {
  IconCalendarMonth,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { setPrefs, useAppPrefs } from "@/features/settings/appPrefs"
import { WidgetCard } from "@/features/widget/WidgetCard"
import { dayLabel } from "./dayLabel"
import { DayPanel } from "./DayPanel"
import { MonthCalendar } from "./MonthCalendar"
import { shiftMonth, toYmd } from "./monthGrid"
import { useMonthEvents } from "./queries"
import { useToday } from "./useToday"

type Props = { className?: string }

export function CalendarSection({ className }: Props) {
  const [ym, setYm] = useState(() => toYmd(new Date()).slice(0, 7))
  const [selected, setSelected] = useState<string | null>(null)
  // 기본은 오늘 일정만. 달력 보기를 누르면 월간 달력이 펼쳐진다
  const { calendarExpanded: expanded } = useAppPrefs()
  const setExpanded = (v: boolean) => setPrefs({ calendarExpanded: v })
  const y = Number(ym.slice(0, 4))
  const m = Number(ym.slice(5))
  const { data = [], isLoading, isError } = useMonthEvents(ym)
  const today = useToday()
  const withEvents = new Set(data.map((e) => e.date))

  const move = (delta: number) => {
    setYm(shiftMonth(ym, delta))
    setSelected(null)
  }

  const pick = (ymd: string, inMonth: boolean) => {
    // 다른 달 칸은 그 달로 이동한 뒤 선택 (데이터가 그 달 기준이므로)
    if (!inMonth) setYm(ymd.slice(0, 7))
    setSelected(inMonth && selected === ymd ? null : ymd)
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
        className={className}
        title={`오늘 · ${dayLabel(today)}`}
        action={toggle}
      >
        <DayPanel
          ymd={today}
          events={data}
          hideLabel
          className="border-t-0 pt-0"
        />
      </WidgetCard>
    )

  return (
    <WidgetCard
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
      <MonthCalendar
        y={y}
        m={m}
        today={today}
        selected={selected}
        withEvents={withEvents}
        onDayClick={pick}
      />
      {(isLoading || isError) && (
        <p className="pb-2 text-center text-xs text-muted-foreground">
          {isLoading ? "불러오는 중..." : "일정을 불러오지 못했습니다."}
        </p>
      )}
      {selected && <DayPanel ymd={selected} events={data} />}
    </WidgetCard>
  )
}
