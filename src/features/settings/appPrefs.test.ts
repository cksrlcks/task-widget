import { describe, expect, test } from "vitest"
import { DEFAULTS, loadPrefs } from "./appPrefs"

describe("loadPrefs", () => {
  test("section order: dedupes, drops unknown, appends missing", () => {
    expect(
      loadPrefs('{"sectionOrder":["calendar","x","calendar","todos"]}')
        .sectionOrder,
    ).toEqual(["calendar", "todos", "pomodoro"])
  })

  test("section heights: keeps known numeric keys, clamps, drops junk", () => {
    expect(
      loadPrefs(
        '{"sectionHeights":{"todos":10,"calendar":300,"x":5,"pomodoro":"a"}}',
      ).sectionHeights,
    ).toEqual({ todos: 48, calendar: 300 })
  })

  test("defaults match spec", () => {
    expect(loadPrefs(null)).toEqual({
      theme: "system",
      zoom: 1,
      anchor: "top-right",
      alwaysOnTop: true,
      closeToTray: true,
      showPomodoro: true,
      showTodos: true,
      showCalendar: true,
      focusMin: 25,
      shortBreakMin: 5,
      longBreakMin: 15,
      longBreakEvery: 4,
      sound: true,
      sectionHeights: {},
      sectionOrder: ["pomodoro", "todos", "calendar"],
      calendarExpanded: false,
    })
  })
  test("partial saved prefs merge over defaults", () => {
    expect(loadPrefs('{"anchor":"free"}').anchor).toBe("free")
    expect(loadPrefs('{"anchor":"free"}').focusMin).toBe(25)
  })
  test("broken json falls back to defaults", () => {
    expect(loadPrefs("{oops")).toEqual(DEFAULTS)
  })
  test("out-of-range values are clamped", () => {
    expect(loadPrefs('{"focusMin":0}').focusMin).toBe(1)
    expect(loadPrefs('{"focusMin":999}').focusMin).toBe(120)
    expect(loadPrefs('{"longBreakEvery":99}').longBreakEvery).toBe(10)
  })
  test("invalid options and types fall back to defaults", () => {
    expect(loadPrefs('{"zoom":2}').zoom).toBe(1)
    expect(loadPrefs('{"anchor":"left"}').anchor).toBe("top-right")
    expect(loadPrefs('{"focusMin":"30"}').focusMin).toBe(25)
    expect(loadPrefs('{"theme":"pink"}').theme).toBe("system")
    expect(loadPrefs('{"sound":"no"}').sound).toBe(true)
    expect(loadPrefs("null")).toEqual(DEFAULTS)
  })
})
