import { Checkbox } from "@/components/ui/checkbox"
import { setPrefs, useAppPrefs } from "../appPrefs"
import { everySchema, minutesSchema } from "../prefsSchema"
import { NumberRow } from "../ui/NumberRow"
import { Row } from "../ui/Row"
import { Section } from "../ui/Section"

export function PomodoroPage() {
  const prefs = useAppPrefs()
  return (
    <>
      <Section title="시간">
        <NumberRow
          k="focusMin"
          title="집중 시간"
          unit="분"
          schema={minutesSchema}
        />
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
