import { expect, test } from "vitest"
import { clampToMonitors, defaultRect } from "./windowPos"

const work = { x: 0, y: 0, width: 1920, height: 1040 }
test("default sits at right edge with full work-area height", () => {
  expect(defaultRect(work, 500)).toEqual({
    x: 1420,
    y: 0,
    width: 500,
    height: 1040,
  })
})
test("saved rect on a disconnected monitor falls back to default", () => {
  expect(
    clampToMonitors(
      { x: 3000, y: 100, width: 500, height: 800 },
      [work],
      work,
      500,
    ),
  ).toEqual(defaultRect(work, 500))
})
test("saved rect on a connected monitor is kept, width follows prefs", () => {
  expect(
    clampToMonitors(
      { x: 100, y: 50, width: 400, height: 700 },
      [work],
      work,
      500,
    ),
  ).toEqual({ x: 100, y: 50, width: 500, height: 700 })
})
test("no saved rect uses the primary default", () => {
  expect(clampToMonitors(null, [work], work, 500)).toEqual(
    defaultRect(work, 500),
  )
})
test("top bar center decides: body on screen but bar above it falls back", () => {
  expect(
    clampToMonitors(
      { x: 100, y: -40, width: 500, height: 800 },
      [work],
      work,
      500,
    ),
  ).toEqual(defaultRect(work, 500))
})
test("saved height is clamped to the monitor work area", () => {
  expect(
    clampToMonitors(
      { x: 100, y: 0, width: 500, height: 3000 },
      [work],
      work,
      500,
    ).height,
  ).toBe(work.height)
})
