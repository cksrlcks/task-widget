import { zodResolver } from "@hookform/resolvers/zod"
import { IconPencil, IconPlus, IconTrash } from "@tabler/icons-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useConfirm } from "@/hooks/use-confirm"
import { cn } from "@/lib/utils"
import { sortDayEvents } from "./monthGrid"
import { useAddEvent, useDeleteEvent, useUpdateEvent } from "./queries"
import type { CalEvent } from "./type"

const schema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요.").max(200),
  time: z.string().regex(/^$|^\d{2}:\d{2}$/, "시간 형식이 올바르지 않습니다."),
  memo: z.string().max(2000),
})
type FormValues = z.infer<typeof schema>

const DOW = ["일", "월", "화", "수", "목", "금", "토"]
/** "2026-10-31" → "10월 31일 토요일" */
export const dayLabel = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number)
  return `${m}월 ${d}일 ${DOW[new Date(y, m - 1, d).getDay()]}요일`
}

const fail = (err: unknown) =>
  toast.error(err instanceof Error ? err.message : "일정을 삭제하지 못했습니다.")

type FormProps = { ymd: string; event?: CalEvent; onDone: () => void }

/** 대화상자가 열릴 때마다 새로 마운트돼 입력값이 초기화된다 */
function EventForm({ ymd, event, onDone }: FormProps) {
  const add = useAddEvent()
  const update = useUpdateEvent()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: event
      ? { title: event.title, time: event.time, memo: event.memo }
      : { title: "", time: "", memo: "" },
  })

  const submit = handleSubmit(async (v) => {
    try {
      if (event) await update.mutateAsync({ id: event.id, ...v })
      else await add.mutateAsync({ ...v, date: ymd })
      toast.success(event ? "일정을 수정했습니다." : "일정을 추가했습니다.")
      onDone()
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "일정을 저장하지 못했습니다." })
    }
  })

  return (
    <form onSubmit={submit} className="contents">
      <DialogHeader>
        <DialogTitle>{event ? "일정 수정" : "새 일정"}</DialogTitle>
        <DialogDescription>{dayLabel(ymd)}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Input
          autoFocus
          aria-label="제목"
          placeholder="제목"
          maxLength={200}
          aria-invalid={!!errors.title}
          {...register("title")}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-8 shrink-0">시간</span>
          <Input type="time" className="w-28" aria-invalid={!!errors.time} {...register("time")} />
          <span>비우면 종일</span>
        </label>
        <textarea
          aria-label="메모"
          placeholder="메모 (선택)"
          maxLength={2000}
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-card px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/40"
          {...register("memo")}
        />
        {(errors.title || errors.time || errors.root) && (
          <p role="alert" className="text-xs text-destructive">
            {errors.title?.message ?? errors.time?.message ?? errors.root?.message}
          </p>
        )}
      </div>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>취소</DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {event ? "저장" : "추가"}
        </Button>
      </DialogFooter>
    </form>
  )
}

type DialogProps = {
  ymd: string
  /** 있으면 수정, 없으면 추가 */
  event?: CalEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDialog({ ymd, event, open, onOpenChange }: DialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <EventForm ymd={ymd} event={event} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}

function EventRow({ event, onEdit }: { event: CalEvent; onEdit: () => void }) {
  const del = useDeleteEvent()
  const confirm = useConfirm()

  const remove = async () => {
    if (!(await confirm("일정을 삭제할까요?", "이 작업은 되돌릴 수 없습니다."))) return
    del.mutate(event.id, { onError: fail })
  }

  return (
    <li className="group flex items-start gap-2 rounded-md px-2 py-1 hover:bg-muted/70">
      <span className="w-9 shrink-0 text-xs leading-5 text-muted-foreground tabular-nums">
        {event.time || "종일"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 break-all">{event.title}</p>
        {event.memo && (
          <p className="text-xs break-all whitespace-pre-wrap text-muted-foreground">{event.memo}</p>
        )}
      </div>
      <div className="flex opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
        <Button variant="ghost" size="icon-xs" aria-label="수정" title="수정" onClick={onEdit}>
          <IconPencil />
        </Button>
        <Button variant="ghost" size="icon-xs" aria-label="삭제" title="삭제" onClick={remove}>
          <IconTrash />
        </Button>
      </div>
    </li>
  )
}

type Props = { ymd: string; events: CalEvent[]; className?: string }

/** 고른 날의 일정 목록. 추가·수정은 대화상자에서 한다 */
export function DayPanel({ ymd, events, className }: Props) {
  // undefined = 닫힘, null = 새 일정, CalEvent = 수정
  const [editing, setEditing] = useState<CalEvent | null | undefined>(undefined)
  const day = sortDayEvents(events.filter((e) => e.date === ymd))

  return (
    <div className={cn("flex flex-col gap-1 border-t px-1.5 pt-2 pb-1.5", className)}>
      <div className="flex items-center justify-between pr-0.5 pl-2">
        <p className="text-xs font-semibold">{dayLabel(ymd)}</p>
        <Button size="sm" variant="outline" onClick={() => setEditing(null)}>
          <IconPlus />
          일정 추가
        </Button>
      </div>
      {day.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">일정이 없어요</p>
      ) : (
        <ul className="max-h-40 overflow-y-auto">
          {day.map((e) => (
            <EventRow key={e.id} event={e} onEdit={() => setEditing(e)} />
          ))}
        </ul>
      )}
      <EventDialog
        ymd={ymd}
        event={editing ?? undefined}
        open={editing !== undefined}
        onOpenChange={(o) => !o && setEditing(undefined)}
      />
    </div>
  )
}
