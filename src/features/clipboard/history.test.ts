import { describe, expect, test } from "vitest"
import { addClip, MAX_ITEMS, MAX_TEXT, sortClips } from "./history"
import type { ClipItem } from "./type"

let n = 0
const id = () => `id${++n}`
const clip = (text: string, pinned = false): ClipItem => ({
  id: text,
  text,
  pinned,
})

describe("addClip", () => {
  test("new text goes to the front", () => {
    expect(addClip([clip("a")], "b", id).map((c) => c.text)).toEqual(["b", "a"])
  })

  test("same text moves to the front and keeps id and pin", () => {
    const out = addClip([clip("a"), clip("b", true)], "b", id)
    expect(out).toEqual([clip("b", true), clip("a")])
  })

  test("ignores blank and too long text", () => {
    const list = [clip("a")]
    expect(addClip(list, "  \n", id)).toBe(list)
    expect(addClip(list, "x".repeat(MAX_TEXT + 1), id)).toBe(list)
  })

  test("keeps only the latest unpinned items, never drops pinned", () => {
    const list = [
      clip("p", true),
      ...Array.from({ length: MAX_ITEMS }, (_, i) => clip(`t${i}`)),
    ]
    const out = addClip(list, "new", id)
    expect(out.filter((c) => !c.pinned)).toHaveLength(MAX_ITEMS)
    expect(out.some((c) => c.text === "p")).toBe(true)
    expect(out.some((c) => c.text === `t${MAX_ITEMS - 1}`)).toBe(false)
  })
})

test("sortClips puts pinned first, keeping recency order", () => {
  const out = sortClips([
    clip("a"),
    clip("b", true),
    clip("c"),
    clip("d", true),
  ])
  expect(out.map((c) => c.text)).toEqual(["b", "d", "a", "c"])
})
