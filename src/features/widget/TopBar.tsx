import { IconEyeOff, IconSettings } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { isTauri } from "@/features/shell/platform"
import { cn } from "@/lib/utils"

type Props = { onSettings: () => void; className?: string }

const fail = (err: unknown) =>
  toast.error(err instanceof Error ? err.message : "창을 다루지 못했습니다.")

const hide = () => {
  if (!isTauri()) return
  void import("@tauri-apps/api/window")
    .then(({ getCurrentWindow }) => getCurrentWindow().hide())
    .catch(fail)
}

/** 위젯에 마우스를 올리면 오른쪽 위에 나타나는 설정·숨기기 버튼. 숨기기는 데스크톱만 */
export function TopBar({ onSettings, className }: Props) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute top-3 right-3 z-10 flex gap-0.5 rounded-md border border-black/[.06] bg-card p-0.5 opacity-0 shadow-sm transition-opacity duration-150 group-hover/widget:pointer-events-auto group-hover/widget:opacity-100 has-[:focus-visible]:pointer-events-auto has-[:focus-visible]:opacity-100 dark:border-white/[.08]",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="설정"
        title="설정"
        onClick={onSettings}
      >
        <IconSettings />
      </Button>
      {isTauri() && (
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="숨기기"
          title="숨기기"
          onClick={hide}
        >
          <IconEyeOff />
        </Button>
      )}
    </div>
  )
}
