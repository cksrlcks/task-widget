import { expect, test } from "vitest"
import { anchoredRect, nearestAnchor, placeRect } from "./windowPos"

const work = { x: 0, y: 0, width: 1920, height: 1040 }
const scr = { work, scale: 1 }

test("top-right keeps a 20px margin from the top and right", () => {
  expect(anchoredRect(work, { width: 360, height: 640 }, "top-right", 20)).toEqual({
    x: 1540,
    y: 20,
    width: 360,
    height: 640,
  })
})
test("bottom-right keeps a 20px margin from the bottom and right", () => {
  expect(anchoredRect(work, { width: 360, height: 640 }, "bottom-right", 20)).toEqual({
    x: 1540,
    y: 380,
    width: 360,
    height: 640,
  })
})
test("anchored size shrinks to fit inside the margins", () => {
  expect(anchoredRect(work, { width: 360, height: 3000 }, "top-right", 20).height).toBe(1000)
})
test("first run: default 320x720 at top-right, scaled to physical px", () => {
  expect(placeRect(null, [scr], { work, scale: 1.5 }, "free")).toEqual({
    x: 1920 - 480 - 30,
    y: 30,
    width: 480,
    height: 980, // 1080 → 작업 영역 1040 - 여백 30×2
  })
})
test("free mode keeps a saved rect on a connected screen", () => {
  const saved = { x: 100, y: 50, width: 400, height: 700 }
  expect(placeRect(saved, [scr], scr, "free")).toEqual(saved)
})
test("free mode: saved rect on a disconnected screen goes to top-right, keeping size", () => {
  expect(placeRect({ x: 3000, y: 100, width: 400, height: 700 }, [scr], scr, "free")).toEqual({
    x: 1500,
    y: 20,
    width: 400,
    height: 700,
  })
})
test("anchored mode ignores the saved position but keeps the saved size", () => {
  expect(placeRect({ x: 100, y: 50, width: 400, height: 500 }, [scr], scr, "bottom-right")).toEqual({
    x: 1500,
    y: 520,
    width: 400,
    height: 500,
  })
})
test("top bar center decides: body on screen but bar above it falls back", () => {
  expect(placeRect({ x: 100, y: -40, width: 400, height: 700 }, [scr], scr, "free").y).toBe(20)
})
test("dropped in the upper half snaps top-right, lower half bottom-right", () => {
  expect(nearestAnchor({ x: 800, y: 100, width: 320, height: 400 }, work)).toBe("top-right")
  expect(nearestAnchor({ x: 800, y: 500, width: 320, height: 400 }, work)).toBe("bottom-right")
})
