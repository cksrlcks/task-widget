import { expect, test } from "vitest"
import { reorder, sortTodos } from "./sortTodos"
import type { Todo } from "./type"

const t = (
  id: string,
  done: boolean,
  created: string,
  updated = created,
  position = 0,
): Todo => ({
  id,
  title: id,
  done,
  position,
  created,
  updated,
})

test("undone first by created asc, done after by updated desc", () => {
  const out = sortTodos([
    t("a", true, "1", "5"),
    t("b", false, "2"),
    t("c", false, "1"),
    t("d", true, "1", "9"),
  ])
  expect(out.map((x) => x.id)).toEqual(["c", "b", "d", "a"])
})

test("undone sorted by position before created", () => {
  const out = sortTodos([
    t("a", false, "1", "1", 2048),
    t("b", false, "2", "2", 1024),
  ])
  expect(out.map((x) => x.id)).toEqual(["b", "a"])
})

const apply = (list: Todo[], ups: { id: string; position: number }[]) =>
  sortTodos(
    list.map((x) => ({
      ...x,
      position: ups.find((u) => u.id === x.id)?.position ?? x.position,
    })),
  )

test("first reorder of unpositioned list renumbers everything", () => {
  const list = [t("a", false, "1"), t("b", false, "2"), t("c", false, "3")]
  const ups = reorder(list, 2, 0)
  expect(apply(list, ups).map((x) => x.id)).toEqual(["c", "a", "b"])
})

test("later reorder moves only one item", () => {
  const list = [
    t("a", false, "1", "1", 1024),
    t("b", false, "2", "2", 2048),
    t("c", false, "3", "3", 3072),
  ]
  for (const [from, to, want] of [
    [0, 2, ["b", "c", "a"]],
    [2, 0, ["c", "a", "b"]],
    [0, 1, ["b", "a", "c"]],
  ] as const) {
    const ups = reorder(list, from, to)
    expect(ups).toHaveLength(1)
    expect(apply(list, ups).map((x) => x.id)).toEqual(want)
  }
})
