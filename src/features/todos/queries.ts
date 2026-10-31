import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { pb } from "@/lib/pb"
import { sortTodos } from "./sortTodos"
import type { Todo } from "./type"

export const todoKeys = { all: ["todos"] as const }

export function useTodos() {
  return useQuery({
    queryKey: todoKeys.all,
    queryFn: async () =>
      sortTodos(
        await pb.collection("todos").getFullList<Todo>({ sort: "created" }),
      ),
  })
}

function useTodoMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: () => qc.invalidateQueries({ queryKey: todoKeys.all }),
  })
}

export function useAddTodo() {
  const qc = useQueryClient()
  // 새 할 일은 맨 아래로
  return useTodoMutation((title: string) => {
    const list = qc.getQueryData<Todo[]>(todoKeys.all) ?? []
    const position = Math.max(0, ...list.map((t) => t.position ?? 0)) + 1024
    return pb
      .collection("todos")
      .create({ title, position, user: pb.authStore.record?.id })
  })
}

/** 끌어서 순서 바꾸기. 놓자마자 화면에 반영하고 서버에 저장한다 */
export function useReorderTodos() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ups: { id: string; position: number }[]) =>
      Promise.all(
        ups.map(({ id, position }) =>
          pb.collection("todos").update(id, { position }),
        ),
      ),
    onMutate: (ups) =>
      qc.setQueryData<Todo[]>(todoKeys.all, (list = []) =>
        sortTodos(
          list.map((t) => ({
            ...t,
            position: ups.find((u) => u.id === t.id)?.position ?? t.position,
          })),
        ),
      ),
    onSettled: () => qc.invalidateQueries({ queryKey: todoKeys.all }),
  })
}

export const useUpdateTodo = () =>
  useTodoMutation(
    ({ id, ...data }: { id: string; title?: string; done?: boolean }) =>
      pb.collection("todos").update(id, data),
  )

export const useDeleteTodo = () =>
  useTodoMutation((id: string) => pb.collection("todos").delete(id))

export const useClearDone = () =>
  useTodoMutation(async (ids: string[]) => {
    const rs = await Promise.allSettled(
      ids.map((id) => pb.collection("todos").delete(id)),
    )
    const n = rs.filter((r) => r.status === "rejected").length
    if (n) throw new Error(`${n}개를 지우지 못했습니다.`)
  })
