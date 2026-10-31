import { ClientResponseError } from "pocketbase"
import { expect, test, vi } from "vitest"
import { authErrorMessage } from "./authErrors"
import { bootAuth } from "./bootAuth"

const pbErr = (status: number, data: object) =>
  new ClientResponseError({ status, response: { data } })

function fake(o: { token: string; isValid?: boolean; refresh?: "ok" | { status: number } }) {
  return {
    authStore: { token: o.token, isValid: o.isValid ?? false, clear: vi.fn() },
    collection: () => ({
      authRefresh: async () => {
        if (o.refresh && o.refresh !== "ok") throw pbErr(o.refresh.status, {})
        return {}
      },
    }),
  } as unknown as Parameters<typeof bootAuth>[0] & {
    authStore: { clear: ReturnType<typeof vi.fn> }
  }
}

test("no saved token -> login", async () => {
  expect(await bootAuth(fake({ token: "" }))).toBe("login")
})
test("web: no token but cookie session -> refreshes via cookie", async () => {
  expect(await bootAuth(fake({ token: "", isValid: true, refresh: "ok" }))).toBe("authed")
})
test("refresh ok -> authed", async () => {
  expect(await bootAuth(fake({ token: "t", refresh: "ok" }))).toBe("authed")
})
test("refresh 401 -> clears token and login", async () => {
  const c = fake({ token: "t", refresh: { status: 401 } })
  expect(await bootAuth(c)).toBe("login")
  expect(c.authStore.clear).toHaveBeenCalled()
})
test("network error (status 0) -> offline, token kept", async () => {
  const c = fake({ token: "t", refresh: { status: 0 } })
  expect(await bootAuth(c)).toBe("offline")
  expect(c.authStore.clear).not.toHaveBeenCalled()
})
test("signup duplicate email message", () => {
  expect(
    authErrorMessage(
      pbErr(400, { email: { code: "validation_not_unique" } }),
      "signup",
    ),
  ).toBe(
    "이미 가입된 이메일입니다. 구글/카카오로 로그인하거나 비밀번호 찾기로 비밀번호를 만드세요.",
  )
})
test("login unverified message", () => {
  expect(authErrorMessage(pbErr(400, {}), "login")).toBe(
    "이메일 또는 비밀번호가 맞지 않거나, 아직 이메일 인증을 하지 않았습니다.",
  )
})
test("network error message", () => {
  expect(authErrorMessage(pbErr(0, {}), "login")).toBe(
    "서버에 연결할 수 없습니다.",
  )
})
test("login unverified (PocketBase authRule -> 403) message", () => {
  expect(authErrorMessage(pbErr(403, {}), "login")).toBe(
    "이메일 또는 비밀번호가 맞지 않거나, 아직 이메일 인증을 하지 않았습니다.",
  )
})
