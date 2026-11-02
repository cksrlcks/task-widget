import { toast } from "sonner"
import { clearClips, removeClip, togglePin, useClips } from "./clipboardStore"
import { toastClipError } from "./toastClipError"
import type { ClipList } from "./type"

/** 위젯이 직접 모은 기록(시스템 기록을 읽을 수 없는 macOS 등) */
export function useLocalHistory(): ClipList {
  return {
    clips: useClips(),
    canPin: true,
    copy: (c) =>
      void navigator.clipboard
        .writeText(c.text)
        .then(() => toast.success("복사했어요"), toastClipError),
    remove: (c) => removeClip(c.id),
    togglePin: (c) => togglePin(c.id),
    clear: clearClips,
    clearNote: "고정한 항목만 남고 나머지는 모두 삭제됩니다.",
  }
}
