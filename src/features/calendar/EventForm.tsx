import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { dayLabel } from "./dayLabel"
import { useAddEvent, useUpdateEvent } from "./queries"
import { eventSchema, type EventFormValues } from "./schema"
import type { CalEvent } from "./type"

type FormProps = { ymd: string; event?: CalEvent; onDone: () => void }

/** 섹션 안에 펼쳐지는 일정 입력. 열 때마다 새로 마운트돼 입력값이 초기화된다 */
export function EventForm({ ymd, event, onDone }: FormProps) {
  const add = useAddEvent()
  const update = useUpdateEvent()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
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
      setError("root", {
        message:
          err instanceof Error ? err.message : "일정을 저장하지 못했습니다.",
      })
    }
  })

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => e.key === "Escape" && onDone()}
      className="flex flex-col gap-2 px-1.5 pt-1 pb-1.5"
    >
      <p className="text-xs font-semibold">
        {event ? "일정 수정" : "새 일정"}
        <span className="ml-1.5 font-normal text-muted-foreground">
          {dayLabel(ymd)}
        </span>
      </p>
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
          <Input
            type="time"
            className="w-28"
            aria-invalid={!!errors.time}
            {...register("time")}
          />
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
            {errors.title?.message ??
              errors.time?.message ??
              errors.root?.message}
          </p>
        )}
      </div>
      <div className="flex justify-end gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={onDone}>
          취소
        </Button>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {event ? "저장" : "추가"}
        </Button>
      </div>
    </form>
  )
}
