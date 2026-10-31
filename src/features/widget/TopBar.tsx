import {
  IconArrowLeft,
  IconDownload,
  IconEyeOff,
  IconPin,
  IconPinFilled,
  IconSettings,
} from "@tabler/icons-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { useDesktopDownload } from "@/features/download/useDesktopDownload"
import { setPrefs, useAppPrefs } from "@/features/settings/appPrefs"
import { isTauri } from "@/features/shell/platform"
import { cn } from "@/lib/utils"
import { hideWindow } from "./hideWindow"

type Props = {
  settings: boolean
  onSettings: () => void
  onBack: () => void
  /** 새 버전이 있으면 그 버전과 설치 함수 */
  update?: { version: string; installing: boolean; install: () => void }
  className?: string
}

/**
 * 위젯 맨 위 헤더. 평소엔 마우스를 올릴 때만 보이고(빈 곳은 창 끌기 손잡이), 설정 화면에선 뒤로 가기와 함께 늘 보인다.
 * 웹은 마우스 올리기가 없는 기기도 있어 늘 보인다
 */
export function TopBar({
  settings,
  onSettings,
  onBack,
  update,
  className,
}: Props) {
  const download = useDesktopDownload()
  const { alwaysOnTop } = useAppPrefs()
  return (
    <header
      className={cn(
        "flex h-9 shrink-0 items-center gap-0.5 px-2 transition-opacity duration-150",
        !settings &&
          isTauri() &&
          "opacity-0 group-hover/widget:opacity-100 has-[:focus-visible]:opacity-100",
        className,
      )}
    >
      {settings && (
        <>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="뒤로"
            title="뒤로"
            onClick={onBack}
          >
            <IconArrowLeft />
          </Button>
          <h1 className="text-sm font-semibold">설정</h1>
        </>
      )}
      {!settings && (
        <h1 className="pl-1 text-xs font-semibold text-muted-foreground">
          Task Widget
        </h1>
      )}
      <span className="flex-1" />
      {download && !settings && (
        <a
          href={download.url}
          className={buttonVariants({ variant: "outline", size: "xs" })}
        >
          <IconDownload />
          {download.label}
        </a>
      )}
      {update && (
        <Button
          variant="outline"
          size="xs"
          title={`v${update.version}로 업데이트하고 다시 시작합니다`}
          disabled={update.installing}
          onClick={update.install}
        >
          <IconDownload />
          {update.installing ? "업데이트 중…" : "업데이트"}
        </Button>
      )}
      {isTauri() && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="항상 위에 표시"
          aria-pressed={alwaysOnTop}
          title={alwaysOnTop ? "항상 위에 표시 끄기" : "항상 위에 표시"}
          onClick={() => setPrefs({ alwaysOnTop: !alwaysOnTop })}
        >
          {alwaysOnTop ? (
            <IconPinFilled className="text-primary" />
          ) : (
            <IconPin />
          )}
        </Button>
      )}
      {!settings && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="설정"
          title="설정"
          onClick={onSettings}
        >
          <IconSettings />
        </Button>
      )}
      {isTauri() && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="숨기기"
          title="숨기기"
          onClick={hideWindow}
        >
          <IconEyeOff />
        </Button>
      )}
    </header>
  )
}
