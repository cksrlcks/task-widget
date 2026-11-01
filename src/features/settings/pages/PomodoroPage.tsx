import { Checkbox } from "@/components/ui/checkbox"
import { setPrefs, useAppPrefs } from "../appPrefs"
import { minutesSchema } from "../prefsSchema"
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
          title="기본 시간"
          unit="분"
          schema={minutesSchema}
        />
      </Section>
      <Section title="알림">
        <Row title="알림음" desc="타이머가 끝나면 소리로 알립니다">
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
