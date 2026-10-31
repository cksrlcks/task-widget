import { IconListCheck } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { WidgetCard } from "@/features/widget/WidgetCard"
import { useConfirm } from "@/hooks/use-confirm"
import { useDragReorder } from "@/hooks/use-drag-reorder"
import { cn } from "@/lib/utils"
import { useClearDone, useReorderTodos, useTodos } from "./queries"
import { reorder } from "./sortTodos"
import { toastError } from "./toastError"
import { TodoAddInput } from "./TodoAddInput"
import { TodoRow } from "./TodoRow"
import type { Todo } from "./type"

type Props = { className?: string }

export function TodoSection({ className }: Props) {
  const { data = [], isLoading, isError } = useTodos()
  const clear = useClearDone()
  const confirm = useConfirm()
  const hasDone = data.some((t) => t.done)
  const undone = data.filter((t) => !t.done)
  const move = useReorderTodos()
  const done = data.filter((t) => t.done)
  // 안 한 일·한 일은 각자 목록 안에서만 순서를 바꾼다
  const dragUndone = useDragReorder<HTMLUListElement>((from, to) => {
    const ups = reorder(undone, from, to)
    if (ups.length) move.mutate(ups, { onError: toastError })
  })
  const dragDone = useDragReorder<HTMLUListElement>((from, to) => {
    const ups = reorder(done, from, to)
    if (ups.length) move.mutate(ups, { onError: toastError })
  })
  const rows = (list: Todo[], d: typeof dragUndone) =>
    list.map((t, i) => (
      <TodoRow
        key={t.id}
        todo={t}
        onGrab={d.grab(i)}
        dragging={d.dragging === i}
        style={d.shift(i)}
      />
    ))

  const clearDone = async () => {
    if (
      !(await confirm(
        "완료 항목을 지울까요?",
        "완료된 할 일이 모두 삭제됩니다.",
      ))
    )
      return
    clear.mutate(
      data.filter((t) => t.done).map((t) => t.id),
      { onError: toastError },
    )
  }

  const left = data.filter((t) => !t.done).length

  return (
    <WidgetCard
      title={data.length ? `할 일 · ${left}` : "할 일"}
      className={cn("min-h-0", className)}
      action={
        hasDone && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="완료 항목 지우기"
            title="완료 항목 지우기"
            onClick={clearDone}
          >
            <IconListCheck />
          </Button>
        )
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-1.5">
        {isLoading || isError || data.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {isLoading
              ? "불러오는 중..."
              : isError
                ? "할 일을 불러오지 못했습니다."
                : "할 일이 없어요"}
          </p>
        ) : (
          <>
            <ul ref={dragUndone.listRef}>{rows(undone, dragUndone)}</ul>
            <ul ref={dragDone.listRef}>{rows(done, dragDone)}</ul>
          </>
        )}
      </div>
      <TodoAddInput />
    </WidgetCard>
  )
}
