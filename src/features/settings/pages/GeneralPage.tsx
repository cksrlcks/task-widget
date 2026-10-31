import { useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { isTauri } from "@/features/shell/platform"
import { setPrefs, useAppPrefs, type Theme } from "../appPrefs"
import { Row, Section, Segmented } from "../settingsUi"

const THEMES: { value: Theme; label: string }[] = [
  { value: "system", label: "시스템" },
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
]
const ZOOMS = ([0.9, 1, 1.1, 1.25] as const).map((v) => ({
  value: v,
  label: `${Math.round(v * 100)}%`,
}))
const WIDTHS = ([400, 500, 600] as const).map((v) => ({
  value: v,
  label: `${v}px`,
}))

export function GeneralPage() {
  // null = 아직 모름(확인 중이거나 설치된 앱이 아님)
  const [autostart, setAutostart] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const prefs = useAppPrefs()
  const app = isTauri()
  useEffect(() => {
    if (!app) return
    void import("@tauri-apps/plugin-autostart")
      .then((a) => a.isEnabled())
      .then(setAutostart, () => setAutostart(false))
  }, [app])

  async function toggle(on: boolean) {
    setError(null)
    try {
      const a = await import("@tauri-apps/plugin-autostart")
      await (on ? a.enable() : a.disable())
      setAutostart(await a.isEnabled())
    } catch (e) {
      setError(
        `바꾸지 못했습니다 (${e instanceof Error ? e.message : String(e)})`,
      )
    }
  }

  return (
    <>
      <Section title="모양">
        <Row title="테마" desc="시스템을 고르면 OS의 라이트·다크 설정을 따릅니다">
          <Segmented
            label="테마"
            value={prefs.theme}
            options={THEMES}
            onChange={(theme) => setPrefs({ theme })}
          />
        </Row>
        <Row title="화면 크기" desc="글자와 화면 요소를 함께 키우거나 줄입니다">
          <Segmented
            label="화면 크기"
            value={prefs.zoom}
            options={ZOOMS}
            onChange={(zoom) => setPrefs({ zoom })}
          />
        </Row>
        <Row title="위젯 너비">
          <Segmented
            label="위젯 너비"
            value={prefs.width}
            options={WIDTHS}
            onChange={(width) => setPrefs({ width })}
          />
        </Row>
        <Row title="위젯 투명도" desc={`${Math.round(prefs.opacity * 100)}%`}>
          <input
            type="range"
            aria-label="위젯 투명도"
            min={0.7}
            max={1}
            step={0.1}
            value={prefs.opacity}
            onChange={(e) => setPrefs({ opacity: Number(e.target.value) })}
            className="w-40"
          />
        </Row>
      </Section>
      <Section title="시작 및 종료">
        <Row title="항상 위에 표시" desc="다른 창 위에 위젯을 띄워 둡니다">
          <Checkbox
            aria-label="항상 위에 표시"
            checked={prefs.alwaysOnTop}
            onCheckedChange={(v) => setPrefs({ alwaysOnTop: !!v })}
          />
        </Row>
        <Row
          title="컴퓨터 켜면 자동 실행"
          desc={
            error ? (
              <span className="text-destructive">{error}</span>
            ) : app ? (
              "창 없이 트레이에서 시작합니다"
            ) : (
              "설치된 앱에서만 바꿀 수 있습니다"
            )
          }
        >
          <Checkbox
            aria-label="자동 실행"
            checked={!!autostart}
            disabled={autostart === null}
            onCheckedChange={(v) => void toggle(!!v)}
          />
        </Row>
        <Row
          title="창을 닫아도 트레이에서 실행"
          desc="끄면 창을 닫을 때 앱이 종료됩니다"
        >
          <Checkbox
            aria-label="창을 닫아도 트레이에서 실행"
            checked={prefs.closeToTray}
            onCheckedChange={(v) => setPrefs({ closeToTray: !!v })}
          />
        </Row>
      </Section>
    </>
  )
}
