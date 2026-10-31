import { Checkbox } from "@/components/ui/checkbox"
import { setPrefs, useAppPrefs } from "../appPrefs"
import { Row, Section } from "../settingsUi"

const ITEMS = [
  { key: "showPomodoro", title: "뽀모도로 표시" },
  { key: "showTodos", title: "투두 표시" },
  { key: "showCalendar", title: "캘린더 표시" },
] as const

export function SectionsPage() {
  const prefs = useAppPrefs()
  return (
    <Section title="위젯 구성">
      {ITEMS.map(({ key, title }) => (
        <Row key={key} title={title}>
          <Checkbox
            aria-label={title}
            checked={prefs[key]}
            onCheckedChange={(v) => setPrefs({ [key]: !!v })}
          />
        </Row>
      ))}
    </Section>
  )
}
