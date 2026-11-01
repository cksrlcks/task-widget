import { useState } from "react"
import { setPrefs, useAppPrefs } from "../appPrefs"
import { minutesSchema, parseField } from "../prefsSchema"
import { Row } from "./Row"

type NumKey = "focusMin"

/** 유효한 값일 때만 저장한다. 아니면 입력은 그대로 두고 안내 문구만 보인다 */
export function NumberRow({
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
      desc={
        error ? <span className="text-destructive">{error}</span> : undefined
      }
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
