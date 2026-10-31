import { IconTrash } from "@tabler/icons-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useConfirm } from "@/hooks/use-confirm"
import { cn } from "@/lib/utils"
import { useAddTodo, useClearDone, useDeleteTodo, useTodos, useUpdateTodo } from "./queries"
import type { Todo } from "./type"

const titleSchema = z.string().trim().min(1).max(500)
const fail = (err: unknown) =>
  toast.error(err instanceof Error ? err.message : "할 일을 저장하지 못했습니다.")

type Props = { className?: string }

function TodoRow({ todo }: { todo: Todo }) {
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
    <li className="group flex items-center gap-2 py-1">
      <Checkbox
        aria-label={`${todo.title} 완료`}
        checked={todo.done}
        onCheckedChange={(v) => update.mutate({ id: todo.id, done: !!v }, { onError: fail })}
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
          onKeyDown={(e) => (e.key === "Enter" || e.key === "F2") && startEdit()}
          className={cn("flex-1 break-all text-sm", todo.done && "text-muted-foreground line-through opacity-60")}
        >
          {todo.title}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="삭제"
        className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
        onClick={() => del.mutate(todo.id, { onError: fail })}
      >
        <IconTrash />
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

  const submit = () => {
    const r = titleSchema.safeParse(draft)
    if (!r.success) return
    add.mutate(r.data, { onSuccess: () => setDraft(""), onError: fail })
  }

  const clearDone = async () => {
    if (!(await confirm("완료 항목을 지울까요?", "완료된 할 일이 모두 삭제됩니다."))) return
    clear.mutate(data.filter((t) => t.done).map((t) => t.id), { onError: fail })
  }

  return (
    <section className={cn("flex min-h-0 flex-col gap-2 p-3", className)}>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {isLoading || isError || data.length === 0 ? (
          <li className="py-4 text-center text-sm text-muted-foreground">
            {isLoading ? "불러오는 중..." : isError ? "할 일을 불러오지 못했습니다." : "할 일이 없어요"}
          </li>
        ) : (
          data.map((t) => <TodoRow key={t.id} todo={t} />)
        )}
      </ul>
      <Input
        value={draft}
        maxLength={500}
        placeholder="+ 할 일 추가"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && submit()}
      />
      {hasDone && (
        <Button variant="ghost" size="sm" onClick={clearDone}>
          완료 항목 지우기
        </Button>
      )}
    </section>
  )
}
