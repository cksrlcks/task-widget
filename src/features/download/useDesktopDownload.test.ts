import { expect, test } from "vitest"
import { detectOs, pickAsset } from "./useDesktopDownload"

test("detectOs", () => {
  expect(detectOs("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("windows")
  expect(detectOs("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)")).toBe("mac")
  expect(
    detectOs("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile"),
  ).toBeNull()
  expect(detectOs("Mozilla/5.0 (Linux; Android 14) Mobile")).toBeNull()
  expect(detectOs("Mozilla/5.0 (X11; Linux x86_64)")).toBeNull()
})

test("pickAsset", () => {
  const names = [
    "latest.json",
    "Task.Widget_0.1.1_x64-setup.exe",
    "Task.Widget_0.1.1_x64-setup.exe.sig",
    "Task.Widget_0.1.1_x64_en-US.msi",
    "Task.Widget_0.1.1_universal.dmg",
    "Task.Widget_universal.app.tar.gz",
  ]
  expect(pickAsset(names, "windows")).toBe("Task.Widget_0.1.1_x64-setup.exe")
  expect(pickAsset(names, "mac")).toBe("Task.Widget_0.1.1_universal.dmg")
  expect(pickAsset(["latest.json"], "mac")).toBeUndefined()
})
