import { ClientResponseError } from "pocketbase"
import { expect, test } from "vitest"
import { isSessionLost, shouldRefresh } from "./authExpiry"

const DAY = 24 * 60 * 60_000
const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "")
const jwt = (expMs: number) => `${b64({ alg: "HS256" })}.${b64({ exp: expMs / 1000 })}.sig`
const err = (status: number) => new ClientResponseError({ status })

test("no token -> no refresh", () => {
  expect(shouldRefresh("", 0)).toBe(false)
})
test("token far from expiry -> no refresh", () => {
  expect(shouldRefresh(jwt(10 * DAY), 0)).toBe(false)
})
test("token within a day of expiry or already expired -> refresh", () => {
  expect(shouldRefresh(jwt(DAY - 1), 0)).toBe(true)
  expect(shouldRefresh(jwt(1000), 5000)).toBe(true)
})
test("malformed token -> refresh (server decides)", () => {
  expect(shouldRefresh("garbage", 0)).toBe(true)
})
test("401 -> session lost", () => {
  expect(isSessionLost(err(401), true)).toBe(true)
})
test("403 only counts when the local token is invalid", () => {
  expect(isSessionLost(err(403), false)).toBe(true)
  expect(isSessionLost(err(403), true)).toBe(false)
})
test("network error and other errors keep the session", () => {
  expect(isSessionLost(err(0), false)).toBe(false)
  expect(isSessionLost(err(404), false)).toBe(false)
  expect(isSessionLost(new Error("x"), false)).toBe(false)
})
