import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createTodo, deleteTodo, listTodos, updateTodo } from "./services/todos"
import { sortTodos } from "./sortTodos"
import type { Todo } from "./type"

export const todoKeys = { all: ["todos"] as const }

export function useTodos() {
  return useQuery({
    queryKey: todoKeys.all,
    queryFn: async () => sortTodos(await listTodos()),
  })
}

// PocketBase 날짜 형식("2026-10-31 10:37:28.382Z"). 정렬용으로만 쓴다
const nowPb = () => new Date().toISOString().replace("T", " ")

/**
 * optimistic이 있으면 누르는 즉시 목록을 바꿔 보여 주고, 실패하면 되돌린다.
 * 끝나면 서버 값으로 다시 맞춘다
 */
function useTodoMutation<V>(
  fn: (v: V) => Promise<unknown>,
  optimistic?: (list: Todo[], v: V) => Todo[],
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onMutate: async (v: V) => {
      if (!optimistic) return
      await qc.cancelQueries({ queryKey: todoKeys.all })
      const prev = qc.getQueryData<Todo[]>(todoKeys.all)
      if (prev) qc.setQueryData(todoKeys.all, sortTodos(optimistic(prev, v)))
      return { prev }
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(todoKeys.all, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: todoKeys.all }),
  })
}

export function useAddTodo() {
  const qc = useQueryClient()
  // 새 할 일은 맨 아래로
  return useTodoMutation((title: string) => {
    const list = qc.getQueryData<Todo[]>(todoKeys.all) ?? []
    const position = Math.max(0, ...list.map((t) => t.position ?? 0)) + 1024
    return createTodo({ title, position })
  })
}

/** 끌어서 순서 바꾸기. 놓자마자 화면에 반영하고 서버에 저장한다 */
export const useReorderTodos = () =>
  useTodoMutation(
    (ups: { id: string; position: number }[]) =>
      Promise.all(ups.map(({ id, position }) => updateTodo(id, { position }))),
    (list, ups) =>
      list.map((t) => ({
        ...t,
        position: ups.find((u) => u.id === t.id)?.position ?? t.position,
      })),
  )

export const useUpdateTodo = () =>
  useTodoMutation(
    ({ id, ...data }: { id: string; title?: string; done?: boolean }) =>
      updateTodo(id, data),
    (list, { id, ...data }) =>
      list.map((t) => (t.id === id ? { ...t, ...data, updated: nowPb() } : t)),
  )

export const useDeleteTodo = () =>
  useTodoMutation(deleteTodo, (list, id) => list.filter((t) => t.id !== id))

export const useClearDone = () =>
  useTodoMutation(
    async (ids: string[]) => {
      const rs = await Promise.allSettled(ids.map(deleteTodo))
      const n = rs.filter((r) => r.status === "rejected").length
      if (n) throw new Error(`${n}개를 지우지 못했습니다.`)
    },
    (list, ids) => list.filter((t) => !ids.includes(t.id)),
  )
