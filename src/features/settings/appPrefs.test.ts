import { describe, expect, test } from "vitest"
import { DEFAULTS, loadPrefs } from "./appPrefs"

describe("loadPrefs", () => {
  test("defaults match spec", () => {
    expect(loadPrefs(null)).toEqual({
      theme: "system",
      zoom: 1,
      width: 500,
      alwaysOnTop: true,
      opacity: 1,
      closeToTray: true,
      showPomodoro: true,
      showTodos: true,
      showCalendar: true,
      focusMin: 25,
      shortBreakMin: 5,
      longBreakMin: 15,
      longBreakEvery: 4,
      sound: true,
    })
  })
  test("partial saved prefs merge over defaults", () => {
    expect(loadPrefs('{"width":600}').width).toBe(600)
    expect(loadPrefs('{"width":600}').focusMin).toBe(25)
  })
  test("broken json falls back to defaults", () => {
    expect(loadPrefs("{oops")).toEqual(DEFAULTS)
  })
  test("out-of-range values are clamped", () => {
    expect(loadPrefs('{"opacity":0.1}').opacity).toBe(0.7)
    expect(loadPrefs('{"focusMin":0}').focusMin).toBe(1)
    expect(loadPrefs('{"focusMin":999}').focusMin).toBe(120)
    expect(loadPrefs('{"longBreakEvery":99}').longBreakEvery).toBe(10)
  })
  test("invalid options and types fall back to defaults", () => {
    expect(loadPrefs('{"zoom":2}').zoom).toBe(1)
    expect(loadPrefs('{"width":450}').width).toBe(500)
    expect(loadPrefs('{"focusMin":"30"}').focusMin).toBe(25)
    expect(loadPrefs('{"theme":"pink"}').theme).toBe("system")
    expect(loadPrefs('{"sound":"no"}').sound).toBe(true)
    expect(loadPrefs("null")).toEqual(DEFAULTS)
  })
})
