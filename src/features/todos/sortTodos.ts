import type { Todo } from "./type"

// PocketBase 날짜는 고정 포맷 문자열이라 문자열 비교로 시간순이 된다
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export function sortTodos(list: Todo[]): Todo[] {
  return [...list].sort((a, b) =>
    a.done !== b.done ? (a.done ? 1 : -1) : a.done ? cmp(b.updated, a.updated) : cmp(a.created, b.created),
  )
}
