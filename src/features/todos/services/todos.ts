import { pb } from "@/lib/pb"
import type { Todo } from "../type"

// 백엔드(PocketBase) 호출은 여기서만. 백엔드를 바꾸면 이 파일만 고친다
const todos = () => pb.collection("todos")

export const listTodos = () => todos().getFullList<Todo>({ sort: "created" })

export const createTodo = (v: Pick<Todo, "title" | "position">) =>
  todos().create({ ...v, user: pb.authStore.record?.id })

export const updateTodo = (
  id: string,
  data: Partial<Pick<Todo, "title" | "done" | "position">>,
) => todos().update(id, data)

export const deleteTodo = (id: string) => todos().delete(id)
