import { IconPencil, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useConfirm } from "@/hooks/use-confirm"
import { useDeleteEvent } from "./queries"
import type { CalEvent } from "./type"

const fail = (err: unknown) =>
  toast.error(
    err instanceof Error ? err.message : "일정을 삭제하지 못했습니다.",
  )

export function EventRow({
  event,
  onEdit,
}: {
  event: CalEvent
  onEdit: () => void
}) {
  const del = useDeleteEvent()
  const confirm = useConfirm()

  const remove = async () => {
    if (!(await confirm("일정을 삭제할까요?", "이 작업은 되돌릴 수 없습니다.")))
      return
    del.mutate(event.id, { onError: fail })
  }

  return (
    <li
      data-no-drag
      className="group flex items-start gap-2 rounded-md px-2 py-1 hover:bg-muted/70"
    >
      <span className="w-9 shrink-0 text-xs leading-5 text-muted-foreground tabular-nums">
        {event.time || "종일"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-5 break-all">{event.title}</p>
        {event.memo && (
          <p className="text-xs break-all whitespace-pre-wrap text-muted-foreground">
            {event.memo}
          </p>
        )}
      </div>
      <div className="flex opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="수정"
          title="수정"
          onClick={onEdit}
        >
          <IconPencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="삭제"
          title="삭제"
          onClick={remove}
        >
          <IconTrash />
        </Button>
      </div>
    </li>
  )
}
