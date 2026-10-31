import { useState } from "react"
import { IconPlus } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { useAddTodo } from "./queries"
import { titleSchema } from "./schema"
import { toastError } from "./toastError"

/** 목록 아래 입력칸. Enter로 추가한다 */
export function TodoAddInput() {
  const add = useAddTodo()
  const [draft, setDraft] = useState("")

  const submit = () => {
    const r = titleSchema.safeParse(draft)
    if (!r.success) return
    add.mutate(r.data, { onSuccess: () => setDraft(""), onError: toastError })
  }

  return (
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
  )
}
