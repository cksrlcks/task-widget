import { expect, test } from "vitest"
import { sortTodos } from "./sortTodos"
import type { Todo } from "./type"

const t = (id: string, done: boolean, created: string, updated = created): Todo => ({
  id,
  title: id,
  done,
  created,
  updated,
})

test("undone first by created asc, done after by updated desc", () => {
  const out = sortTodos([t("a", true, "1", "5"), t("b", false, "2"), t("c", false, "1"), t("d", true, "1", "9")])
  expect(out.map((x) => x.id)).toEqual(["c", "b", "d", "a"])
})
