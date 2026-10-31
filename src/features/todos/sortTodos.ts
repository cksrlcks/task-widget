import type { Todo } from "./type"

// PocketBase 날짜는 고정 포맷 문자열이라 문자열 비교로 시간순이 된다
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** 안 한 일은 정한 순서(같으면 만든 순서), 한 일은 아래로 최근 완료 순 */
export function sortTodos(list: Todo[]): Todo[] {
  return [...list].sort((a, b) =>
    a.done !== b.done
      ? a.done
        ? 1
        : -1
      : a.done
        ? cmp(b.updated, a.updated)
        : (a.position ?? 0) - (b.position ?? 0) || cmp(a.created, b.created),
  )
}

/**
 * 안 한 일 목록에서 from번째를 to번째로 옮길 때 바꿔야 할 position들.
 * 이웃 사이에 자리가 있으면 그 하나만, 없으면(처음엔 전부 0) 전체를 다시 번호 매긴다
 */
export function reorder(
  list: Todo[],
  from: number,
  to: number,
): { id: string; position: number }[] {
  if (from === to) return []
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  const prev = next[to - 1]?.position
  const after = next[to + 1]?.position
  if (prev === undefined && after !== undefined && after > 0)
    return [{ id: moved.id, position: after / 2 }]
  if (prev !== undefined && after === undefined && prev > 0)
    return [{ id: moved.id, position: prev + 1024 }]
  if (
    prev !== undefined &&
    after !== undefined &&
    after - prev > 1e-6 &&
    prev > 0
  )
    return [{ id: moved.id, position: (prev + after) / 2 }]
  return next.flatMap((t, i) =>
    t.position === (i + 1) * 1024
      ? []
      : [{ id: t.id, position: (i + 1) * 1024 }],
  )
}
