import { expect, test } from "vitest"
import { everySchema, minutesSchema, parseField } from "./prefsSchema"

test("accepts in-range integers", () => {
  expect(parseField(minutesSchema, "25")).toEqual({ value: 25 })
  expect(parseField(minutesSchema, "120")).toEqual({ value: 120 })
  expect(parseField(everySchema, "1")).toEqual({ value: 1 })
})
test("rejects empty, out of range and non-integers", () => {
  for (const raw of ["", " ", "0", "121", "1.5", "abc"])
    expect(parseField(minutesSchema, raw)).toHaveProperty("error")
  expect(parseField(everySchema, "11")).toHaveProperty("error")
})
