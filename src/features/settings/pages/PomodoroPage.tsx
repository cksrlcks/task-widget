import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { setPrefs, useAppPrefs } from "../appPrefs"
import { everySchema, minutesSchema, parseField } from "../prefsSchema"
import { Row, Section } from "../settingsUi"

type NumKey = "focusMin" | "shortBreakMin" | "longBreakMin" | "longBreakEvery"

/** 유효한 값일 때만 저장한다. 아니면 입력은 그대로 두고 안내 문구만 보인다 */
function NumberRow({
  k,
  title,
  unit,
  schema,
}: {
  k: NumKey
  title: string
  unit: string
  schema: typeof minutesSchema
}) {
  const prefs = useAppPrefs()
  const [text, setText] = useState(String(prefs[k]))
  const [error, setError] = useState<string | null>(null)
  return (
    <Row
      title={title}
      desc={error ? <span className="text-destructive">{error}</span> : undefined}
    >
      <span className="flex shrink-0 items-center gap-2 text-sm">
        <input
          type="number"
          aria-label={title}
          aria-invalid={!!error}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            const r = parseField(schema, e.target.value)
            if ("error" in r) setError(r.error)
            else {
              setError(null)
              setPrefs({ [k]: r.value })
            }
          }}
          className="h-8 w-20 rounded-[10px] border border-border bg-card px-2 text-right outline-none focus-visible:ring-2 focus-visible:ring-primary/40 aria-invalid:border-destructive"
        />
        {unit}
      </span>
    </Row>
  )
}

export function PomodoroPage() {
  const prefs = useAppPrefs()
  return (
    <>
      <Section title="시간">
        <NumberRow k="focusMin" title="집중" unit="분" schema={minutesSchema} />
        <NumberRow
          k="shortBreakMin"
          title="짧은 휴식"
          unit="분"
          schema={minutesSchema}
        />
        <NumberRow
          k="longBreakMin"
          title="긴 휴식"
          unit="분"
          schema={minutesSchema}
        />
        <NumberRow
          k="longBreakEvery"
          title="긴 휴식까지 집중 횟수"
          unit="회"
          schema={everySchema}
        />
      </Section>
      <Section title="알림">
        <Row title="알림음" desc="단계가 끝나면 소리로 알립니다">
          <Checkbox
            aria-label="알림음"
            checked={prefs.sound}
            onCheckedChange={(v) => setPrefs({ sound: !!v })}
          />
        </Row>
      </Section>
    </>
  )
}
