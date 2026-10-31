import { IconGripVertical } from "@tabler/icons-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useDragReorder } from "@/hooks/use-drag-reorder"
import { cn } from "@/lib/utils"
import { setPrefs, useAppPrefs, type SectionId } from "../appPrefs"
import { Section } from "../settingsUi"

const ITEMS: Record<
  SectionId,
  { key: "showPomodoro" | "showTodos" | "showCalendar"; title: string }
> = {
  pomodoro: { key: "showPomodoro", title: "뽀모도로" },
  todos: { key: "showTodos", title: "할 일" },
  calendar: { key: "showCalendar", title: "캘린더" },
}

/** 표시할 섹션과 순서. 손잡이를 끌어 위젯에 쌓이는 순서를 바꾼다 */
export function SectionsPage() {
  const prefs = useAppPrefs()
  const order = prefs.sectionOrder
  const { listRef, grab, shift, dragging } = useDragReorder<HTMLUListElement>(
    (from, to) => {
      const next = [...order]
      next.splice(to, 0, ...next.splice(from, 1))
      setPrefs({ sectionOrder: next })
    },
  )
  return (
    <Section title="위젯 구성">
      <ul ref={listRef} className="divide-y divide-border">
        {order.map((id, i) => {
          const { key, title } = ITEMS[id]
          return (
            <li
              key={id}
              data-reorder=""
              style={shift(i)}
              className={cn(
                "relative flex items-center gap-2 py-2.5",
                dragging === i
                  ? "z-10 rounded-md bg-card shadow-md"
                  : "transition-transform duration-150",
              )}
            >
              <span className="flex-1 text-sm font-medium">{title}</span>
              <span
                aria-hidden
                onPointerDown={grab(i)}
                className="flex h-6 w-5 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
              >
                <IconGripVertical className="size-4" />
              </span>
              <Checkbox
                aria-label={`${title} 표시`}
                checked={prefs[key]}
                onCheckedChange={(v) => setPrefs({ [key]: !!v })}
              />
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
