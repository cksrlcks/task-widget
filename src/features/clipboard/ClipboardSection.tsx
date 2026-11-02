import { IconClearAll } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { isWindows } from "@/features/shell/platform"
import { WidgetCard } from "@/features/widget/WidgetCard"
import { useConfirm } from "@/hooks/use-confirm"
import { cn } from "@/lib/utils"
import { ClipRow } from "./ClipRow"
import { sortClips } from "./history"
import { useLocalHistory } from "./useLocalHistory"
import { useWinHistory } from "./useWinHistory"

type Props = { className?: string }

// 실행 중에 바뀌지 않으므로 훅을 하나로 고정해도 된다
const useHistory = isWindows() ? useWinHistory : useLocalHistory

/** 클립보드 기록(Win+V 간략판): 눌러서 다시 복사, 삭제, 모두 지우기 */
export function ClipboardSection({ className }: Props) {
  const list = useHistory()
  const { clips, error } = list
  const confirm = useConfirm()

  const clearAll = async () => {
    if (await confirm("클립보드 기록을 지울까요?", list.clearNote)) list.clear()
  }

  return (
    <WidgetCard
      title={clips.length ? `클립보드 · ${clips.length}` : "클립보드"}
      className={cn("min-h-0", className)}
      action={
        clips.some((c) => !c.pinned) && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="모두 지우기"
            title="모두 지우기"
            onClick={clearAll}
          >
            <IconClearAll />
          </Button>
        )
      }
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-1.5">
        {error || clips.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            {error ?? "복사한 텍스트가 여기에 쌓여요"}
          </p>
        ) : (
          <ul>
            {sortClips(clips).map((c) => (
              <ClipRow key={c.id} clip={c} list={list} />
            ))}
          </ul>
        )}
      </div>
    </WidgetCard>
  )
}
