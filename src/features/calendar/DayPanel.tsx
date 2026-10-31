import { zodResolver } from "@hookform/resolvers/zod"
import { IconPencil, IconTrash } from "@tabler/icons-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
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

const fail = (err: unknown) =>
  toast.error(err instanceof Error ? err.message : "일정을 저장하지 못했습니다.")

type FormProps = {
  initial?: FormValues
  submitLabel: string
  onSubmit: (v: FormValues) => Promise<unknown>
  onCancel?: () => void
}

function EventForm({ initial, submitLabel, onSubmit, onCancel }: FormProps) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? { title: "", time: "", memo: "" },
  })

  const submit = handleSubmit(async (v) => {
    try {
      await onSubmit(v)
      reset({ title: "", time: "", memo: "" })
    } catch (err) {
      setError("root", { message: err instanceof Error ? err.message : "일정을 저장하지 못했습니다." })
    }
  })

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        <Input
          aria-label="시간"
          type="time"
          className="w-24 shrink-0"
          aria-invalid={!!errors.time}
          {...register("time")}
        />
        <Input
          aria-label="제목"
          placeholder="+ 일정 제목"
          maxLength={200}
          aria-invalid={!!errors.title}
          {...register("title")}
        />
      </div>
      <textarea
        aria-label="메모"
        placeholder="메모 (선택)"
        maxLength={2000}
        rows={2}
        className="w-full resize-none rounded-md border border-input bg-card px-2 py-1 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-primary/40"
        {...register("memo")}
      />
      {(errors.title || errors.time || errors.root) && (
        <p role="alert" className="text-xs text-destructive">
          {errors.title?.message ?? errors.time?.message ?? errors.root?.message}
        </p>
      )}
      <div className="flex justify-end gap-1.5">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

function EventRow({ event }: { event: CalEvent }) {
  const update = useUpdateEvent()
  const del = useDeleteEvent()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(false)

  if (editing)
    return (
      <li className="py-1">
        <EventForm
          initial={{ title: event.title, time: event.time, memo: event.memo }}
          submitLabel="저장"
          onCancel={() => setEditing(false)}
          onSubmit={async (v) => {
            await update.mutateAsync({ id: event.id, ...v })
            setEditing(false)
          }}
        />
      </li>
    )

  const remove = async () => {
    if (!(await confirm("일정을 삭제할까요?", "이 작업은 되돌릴 수 없습니다."))) return
    del.mutate(event.id, { onError: fail })
  }

  return (
    <li className="group flex items-start gap-2 py-1">
      <span className="w-10 shrink-0 text-xs leading-5 text-muted-foreground">{event.time || "종일"}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm break-all">{event.title}</p>
        {event.memo && <p className="text-xs break-all whitespace-pre-wrap text-muted-foreground">{event.memo}</p>}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="수정"
        className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => setEditing(true)}
      >
        <IconPencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="삭제"
        className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
        onClick={remove}
      >
        <IconTrash />
      </Button>
    </li>
  )
}

type Props = { ymd: string; events: CalEvent[]; className?: string }

export function DayPanel({ ymd, events, className }: Props) {
  const add = useAddEvent()
  const day = sortDayEvents(events.filter((e) => e.date === ymd))

  return (
    <div className={cn("flex max-h-60 flex-col gap-2 overflow-y-auto border-t pt-2", className)}>
      <p className="text-xs font-medium">{ymd}</p>
      {day.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted-foreground">일정이 없어요</p>
      ) : (
        <ul>
          {day.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ul>
      )}
      <EventForm key={ymd} submitLabel="추가" onSubmit={(v) => add.mutateAsync({ ...v, date: ymd })} />
    </div>
  )
}
