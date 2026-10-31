import { useState } from "react"
import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { dayLabel } from "./dayLabel"
import { EventForm } from "./EventForm"
import { EventRow } from "./EventRow"
import { sortDayEvents } from "./monthGrid"
import type { CalEvent } from "./type"

type Props = {
  ymd: string
  events: CalEvent[]
  /** 카드 제목에 이미 날짜가 있으면 숨긴다 */
  hideLabel?: boolean
  className?: string
}

/** 고른 날의 일정 목록. 추가·수정은 대화상자에서 한다 */
export function DayPanel({ ymd, events, hideLabel, className }: Props) {
  // undefined = 닫힘, null = 새 일정, CalEvent = 수정
  const [editing, setEditing] = useState<CalEvent | null | undefined>(undefined)
  const day = sortDayEvents(events.filter((e) => e.date === ymd))
  const addButton = (
    <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
      <IconPlus />
      일정 추가
    </Button>
  )

  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-t px-1.5 pt-2 pb-1.5",
        className,
      )}
    >
      {editing !== undefined ? (
        // 추가·수정은 섹션 안에서: 목록 자리에 입력 양식이 펼쳐진다
        <EventForm
          key={editing?.id ?? "new"}
          ymd={ymd}
          event={editing ?? undefined}
          onDone={() => setEditing(undefined)}
        />
      ) : (
        <>
          {!hideLabel && (
            <div className="flex items-center justify-between pr-0.5 pl-2">
              <p className="text-xs font-semibold">{dayLabel(ymd)}</p>
              {addButton}
            </div>
          )}
          {day.length === 0 && hideLabel ? (
            // 오늘 보기: 빈 상태와 추가 버튼을 한 줄에 두어 카드를 낮게
            <div className="flex items-center justify-between pl-2">
              <p className="text-xs text-muted-foreground">
                오늘 일정이 없어요
              </p>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setEditing(null)}
              >
                <IconPlus />
                추가
              </Button>
            </div>
          ) : day.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              일정이 없어요
            </p>
          ) : (
            <ul className="max-h-40 overflow-y-auto">
              {day.map((e) => (
                <EventRow key={e.id} event={e} onEdit={() => setEditing(e)} />
              ))}
            </ul>
          )}
          {hideLabel && day.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="justify-start text-muted-foreground"
              onClick={() => setEditing(null)}
            >
              <IconPlus />
              일정 추가
            </Button>
          )}
        </>
      )}
    </div>
  )
}
