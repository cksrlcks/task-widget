import { IconPin, IconPinFilled, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ClipItem, ClipList } from "./type"

type Props = {
  clip: ClipItem
  list: ClipList
}

/** 누르면 클립보드에 다시 복사한다. 긴 내용은 세 줄까지만 보인다 */
export function ClipRow({ clip, list }: Props) {
  return (
    <li className="group flex items-start gap-1 rounded-md py-2 pr-1 pl-2 hover:bg-muted/70">
      <button
        type="button"
        title="눌러서 복사"
        onClick={() => list.copy(clip)}
        className="line-clamp-3 min-w-0 flex-1 cursor-pointer rounded-sm text-left text-sm leading-5 break-all whitespace-pre-wrap outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {clip.image ? (
          <img
            src={clip.image}
            alt="복사한 이미지"
            draggable={false}
            className="max-h-24 max-w-full rounded-sm border border-border object-contain"
          />
        ) : (
          clip.text
        )}
      </button>
      {/* 버튼(24px)을 첫 줄(20px) 가운데에 */}
      <div className="-my-0.5 flex">
        {list.canPin && (
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={clip.pinned ? "고정 해제" : "고정"}
            aria-pressed={clip.pinned}
            title={clip.pinned ? "고정 해제" : "고정"}
            className={cn(
              !clip.pinned &&
                "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100",
            )}
            onClick={() => list.togglePin(clip)}
          >
            {clip.pinned ? <IconPinFilled /> : <IconPin />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="삭제"
          title="삭제"
          className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
          onClick={() => list.remove(clip)}
        >
          <IconX />
        </Button>
      </div>
    </li>
  )
}
