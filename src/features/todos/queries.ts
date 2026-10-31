import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { pb } from "@/lib/pb"
import { sortTodos } from "./sortTodos"
import type { Todo } from "./type"

export const todoKeys = { all: ["todos"] as const }

export function useTodos() {
  return useQuery({
    queryKey: todoKeys.all,
    queryFn: async () => sortTodos(await pb.collection("todos").getFullList<Todo>({ sort: "created" })),
  })
}

function useTodoMutation<V>(fn: (v: V) => Promise<unknown>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: todoKeys.all }),
  })
}

export const useAddTodo = () =>
  useTodoMutation((title: string) => pb.collection("todos").create({ title, user: pb.authStore.record?.id }))

export const useUpdateTodo = () =>
  useTodoMutation(({ id, ...data }: { id: string; title?: string; done?: boolean }) =>
    pb.collection("todos").update(id, data),
  )

export const useDeleteTodo = () => useTodoMutation((id: string) => pb.collection("todos").delete(id))

export const useClearDone = () =>
  useTodoMutation((ids: string[]) => Promise.all(ids.map((id) => pb.collection("todos").delete(id))))
