import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react"
import {
  IconGripVertical,
  IconListCheck,
  IconPlus,
  IconX,
} from "@tabler/icons-react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { WidgetCard } from "@/features/widget/WidgetCard"
import { useConfirm } from "@/hooks/use-confirm"
import { useDragReorder } from "@/hooks/use-drag-reorder"
import { cn } from "@/lib/utils"
import {
  useAddTodo,
  useClearDone,
  useDeleteTodo,
  useReorderTodos,
  useTodos,
  useUpdateTodo,
} from "./queries"
import { reorder } from "./sortTodos"
import type { Todo } from "./type"

const titleSchema = z.string().trim().min(1).max(500)
const fail = (err: unknown) =>
  toast.error(
    err instanceof Error ? err.message : "할 일을 저장하지 못했습니다.",
  )

type Props = { className?: string }

type RowProps = {
  todo: Todo
  /** 안 한 일만: 손잡이를 누르면 끌기 시작 */
  onGrab?: (e: ReactPointerEvent) => void
  dragging?: boolean
  style?: CSSProperties
}

function TodoRow({ todo, onGrab, dragging, style }: RowProps) {
  const update = useUpdateTodo()
  const del = useDeleteTodo()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(todo.title)

  const skipBlur = useRef(false)

  const startEdit = () => {
    setText(todo.title)
    skipBlur.current = false
    setEditing(true)
  }

  const commit = () => {
    setEditing(false)
    const r = titleSchema.safeParse(text)
    if (!r.success || r.data === todo.title) return setText(todo.title)
    update.mutate({ id: todo.id, title: r.data }, { onError: fail })
  }

  return (
    <li
      data-no-drag
      data-undone={todo.done ? undefined : ""}
      data-reorder=""
      style={style}
      className={cn(
        "group relative flex min-h-9 items-center gap-2 rounded-md pr-1 pl-2 hover:bg-muted/70",
        dragging
          ? "z-10 bg-card shadow-md"
          : "transition-transform duration-150",
      )}
    >
      <Checkbox
        aria-label={`${todo.title} 완료`}
        checked={todo.done}
        onCheckedChange={(v) =>
          update.mutate({ id: todo.id, done: !!v }, { onError: fail })
        }
      />
      {editing ? (
        <Input
          autoFocus
          value={text}
          maxLength={500}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => !skipBlur.current && commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              skipBlur.current = true
              commit()
            }
            if (e.key === "Escape") {
              skipBlur.current = true
              setText(todo.title)
              setEditing(false)
            }
          }}
          className="h-7"
        />
      ) : (
        <span
          tabIndex={0}
          onDoubleClick={startEdit}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === "F2") && startEdit()
          }
          className={cn(
            "flex-1 text-sm break-all",
            todo.done && "text-muted-foreground line-through opacity-60",
          )}
        >
          {todo.title}
        </span>
      )}
      <span
        aria-hidden
        onPointerDown={onGrab}
        className={cn(
          "flex h-6 w-4 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/60 opacity-0 group-hover:opacity-100 active:cursor-grabbing",
          dragging && "opacity-100",
        )}
      >
        <IconGripVertical className="size-3.5" />
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="삭제"
        title="삭제"
        className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => del.mutate(todo.id, { onError: fail })}
      >
        <IconX />
      </Button>
    </li>
  )
}

export function TodoSection({ className }: Props) {
  const { data = [], isLoading, isError } = useTodos()
  const add = useAddTodo()
  const clear = useClearDone()
  const confirm = useConfirm()
  const [draft, setDraft] = useState("")
  const hasDone = data.some((t) => t.done)
  const undone = data.filter((t) => !t.done)
  const move = useReorderTodos()
  const done = data.filter((t) => t.done)
  // 안 한 일·한 일은 각자 목록 안에서만 순서를 바꾼다
  const dragUndone = useDragReorder<HTMLUListElement>((from, to) => {
    const ups = reorder(undone, from, to)
    if (ups.length) move.mutate(ups, { onError: fail })
  })
  const dragDone = useDragReorder<HTMLUListElement>((from, to) => {
    const ups = reorder(done, from, to)
    if (ups.length) move.mutate(ups, { onError: fail })
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

  const submit = () => {
    const r = titleSchema.safeParse(draft)
    if (!r.success) return
    add.mutate(r.data, { onSuccess: () => setDraft(""), onError: fail })
  }

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
      { onError: fail },
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
      <div className="relative mx-2 mb-2">
        <IconPlus
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="할 일 추가"
          value={draft}
          maxLength={500}
          placeholder="할 일 추가"
          className="h-10 pl-8 text-sm"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.nativeEvent.isComposing && submit()
          }
        />
      </div>
    </WidgetCard>
  )
}
