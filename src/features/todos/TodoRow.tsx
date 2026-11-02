import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { IconGripVertical, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useDeleteTodo, useUpdateTodo } from "./queries"
import { titleSchema } from "./schema"
import { toastError } from "./toastError"
import type { Todo } from "./type"

type RowProps = {
  todo: Todo
  /** 안 한 일만: 손잡이를 누르면 끌기 시작 */
  onGrab?: (e: ReactPointerEvent) => void
  dragging?: boolean
  style?: CSSProperties
}

export function TodoRow({ todo, onGrab, dragging, style }: RowProps) {
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
    update.mutate({ id: todo.id, title: r.data }, { onError: toastError })
  }

  return (
    <li
      data-no-drag
      data-undone={todo.done ? undefined : ""}
      data-reorder=""
      style={style}
      className={cn(
        // 위쪽 정렬: 줄바꿈돼도 체크박스·버튼이 첫 줄에 맞는다. 줄 높이 20px + 위아래 8px = 한 줄 36px.
        // 첫 줄(20px)과 높이가 다른 요소는 여백으로 첫 줄 가운데에 둔다
        "group relative flex min-h-9 items-start gap-2 rounded-md py-2 pr-1 pl-2 hover:bg-muted/70",
        dragging
          ? "z-10 bg-card shadow-md"
          : "transition-transform duration-150",
      )}
    >
      <Checkbox
        className="my-0.5"
        aria-label={`${todo.title} 완료`}
        checked={todo.done}
        onCheckedChange={(v) =>
          update.mutate({ id: todo.id, done: !!v }, { onError: toastError })
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
          className="-my-1 h-7"
        />
      ) : (
        <span
          tabIndex={0}
          onDoubleClick={startEdit}
          onKeyDown={(e) =>
            (e.key === "Enter" || e.key === "F2") && startEdit()
          }
          className={cn(
            "flex-1 text-sm leading-5 break-all",
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
          "-my-0.5 flex h-6 w-4 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/60 opacity-0 group-hover:opacity-100 active:cursor-grabbing",
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
        className="-my-0.5 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => del.mutate(todo.id, { onError: toastError })}
      >
        <IconX />
      </Button>
    </li>
  )
}
