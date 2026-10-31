import { IconEyeOff, IconSettings } from "@tabler/icons-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { isTauri } from "@/features/shell/platform"
import { cn } from "@/lib/utils"

type Props = { className?: string }

const fail = (err: unknown) =>
  toast.error(err instanceof Error ? err.message : "창을 다루지 못했습니다.")

const openSettings = () => {
  if (!isTauri()) return
  void import("@tauri-apps/api/core")
    .then(({ invoke }) => invoke("open_settings"))
    .catch(fail)
}

const hide = () => {
  if (!isTauri()) return
  void import("@tauri-apps/api/window")
    .then(({ getCurrentWindow }) => getCurrentWindow().hide())
    .catch(fail)
}

/** 끌어서 창 이동(data-tauri-drag-region). 버튼은 드래그 영역에서 빠진다 */
export function TopBar({ className }: Props) {
  return (
    <div
      data-tauri-drag-region
      className={cn(
        "flex h-8 shrink-0 items-center gap-1 px-3 select-none",
        className,
      )}
    >
      <span
        data-tauri-drag-region
        className="flex-1 text-xs font-medium text-muted-foreground"
      >
        Task Widget
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="설정"
        onClick={openSettings}
      >
        <IconSettings />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="숨기기" onClick={hide}>
        <IconEyeOff />
      </Button>
    </div>
  )
}
