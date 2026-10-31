import { expect, test } from "vitest"
import { monthGrid, sortDayEvents, toYmd } from "./monthGrid"
import type { CalEvent } from "./type"

test("toYmd uses local date near midnight", () => {
  expect(toYmd(new Date(2026, 9, 31, 23, 59))).toBe("2026-10-31")
  expect(toYmd(new Date(2026, 10, 1, 0, 1))).toBe("2026-11-01")
})

test("october 2026 grid starts on sunday 9/27 and has 42 cells", () => {
  const g = monthGrid(2026, 10)
  expect(g.length).toBe(42)
  expect(g[0]).toEqual({ ymd: "2026-09-27", inMonth: false })
  expect(g[4]).toEqual({ ymd: "2026-10-01", inMonth: true })
  expect(g[41]).toEqual({ ymd: "2026-11-07", inMonth: false })
})

test("sortDayEvents puts all-day first then time ascending", () => {
  const e = (id: string, time: string): CalEvent => ({ id, title: id, date: "2026-10-31", time, memo: "" })
  const r = sortDayEvents([e("b", "14:00"), e("a", "09:30"), e("d", ""), e("c", "09:30")])
  expect(r.map((x) => x.id)).toEqual(["d", "a", "c", "b"])
})
