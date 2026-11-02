import type { ClipItem } from "./type"

/** Win+V처럼 고정하지 않은 항목은 최근 25개만 남긴다 */
export const MAX_ITEMS = 25
/** 이보다 긴 텍스트는 기록하지 않는다(localStorage 용량) */
export const MAX_TEXT = 20_000

/** 새로 복사한 텍스트를 맨 앞에. 같은 텍스트가 있으면 그 항목(고정 여부 포함)을 앞으로 옮긴다 */
export function addClip(
  list: ClipItem[],
  text: string,
  newId: () => string = () => crypto.randomUUID(),
): ClipItem[] {
  if (!text.trim() || text.length > MAX_TEXT) return list
  const old = list.find((c) => c.text === text)
  let unpinned = 0
  return [
    old ?? { id: newId(), text, pinned: false },
    ...list.filter((c) => c !== old),
  ].filter((c) => c.pinned || ++unpinned <= MAX_ITEMS)
}

/** 고정 항목이 위, 나머지는 최근 순 */
export const sortClips = (list: ClipItem[]) => [
  ...list.filter((c) => c.pinned),
  ...list.filter((c) => !c.pinned),
]
