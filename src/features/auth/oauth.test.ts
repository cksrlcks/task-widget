import { ClientResponseError } from "pocketbase"
import { expect, test, vi } from "vitest"
import { authErrorMessage } from "./authErrors"
import { assertEmail, canUnlink, linkProvider, signInWithProvider } from "./oauth"

vi.mock("@/features/shell/platform", () => ({ openExternal: vi.fn() }))

type Rec = { id: string }
function fake(o: { before: Rec | null; after: Rec; meta?: object }) {
  const authStore = {
    token: o.before ? "tok-before" : "",
    record: o.before as Rec | null,
    save: vi.fn((t: string, r: Rec) => {
      authStore.token = t
      authStore.record = r
    }),
    clear: vi.fn(() => {
      authStore.token = ""
      authStore.record = null
    }),
  }
  const del = vi.fn(async () => true)
  const c = {
    authStore,
    collection: () => ({
      authWithOAuth2: async () => {
        authStore.save("tok-after", o.after)
        return { token: "tok-after", record: o.after, meta: o.meta }
      },
      delete: del,
    }),
  }
  return { c: c as unknown as Parameters<typeof linkProvider>[1], authStore, del }
}

test("cannot unlink the only login method", () => {
  expect(canUnlink(["kakao"], false)).toBe(false)
  expect(canUnlink(["kakao", "google"], false)).toBe(true)
  expect(canUnlink(["kakao"], true)).toBe(true)
})
test("oauth without email is rejected", () => {
  expect(() => assertEmail({})).toThrow("카카오(또는 구글)에서 이메일 제공에 동의해 주세요.")
  expect(() => assertEmail(undefined)).toThrow()
  expect(() => assertEmail({ email: "a@b.c" })).not.toThrow()
})

test("link: same user keeps new token", async () => {
  const f = fake({ before: { id: "me" }, after: { id: "me" } })
  await linkProvider("google", f.c)
  expect(f.authStore.token).toBe("tok-after")
})
test("link: identity owned by another user restores original auth", async () => {
  const f = fake({ before: { id: "me" }, after: { id: "other" } })
  await expect(linkProvider("kakao", f.c)).rejects.toThrow("이미 다른 계정에 연결돼 있습니다.")
  expect(f.authStore.token).toBe("tok-before")
  expect(f.authStore.record).toEqual({ id: "me" })
})

test("sign-in: new user without email is deleted before clearing auth", async () => {
  const f = fake({ before: null, after: { id: "n1" }, meta: { isNew: true } })
  f.del.mockImplementation(async () => {
    expect(f.authStore.token).toBe("tok-after") // 삭제는 인증 상태에서
    return true
  })
  await expect(signInWithProvider("kakao", f.c)).rejects.toThrow("이메일 제공에 동의")
  expect(f.del).toHaveBeenCalledWith("n1")
  expect(f.authStore.token).toBe("")
})
test("sign-in: existing user without email is not deleted", async () => {
  const f = fake({ before: null, after: { id: "u1" }, meta: { isNew: false } })
  await expect(signInWithProvider("google", f.c)).rejects.toThrow()
  expect(f.del).not.toHaveBeenCalled()
  expect(f.authStore.token).toBe("")
})
test("sign-in: with email stays signed in", async () => {
  const f = fake({ before: null, after: { id: "u1" }, meta: { email: "a@b.c" } })
  await signInWithProvider("google", f.c)
  expect(f.authStore.token).toBe("tok-after")
})

test("oauth/link errors: network vs our own messages", () => {
  const net = new ClientResponseError({ status: 0 })
  expect(authErrorMessage(net, "oauth")).toBe("서버에 연결할 수 없습니다.")
  let own: unknown
  try {
    assertEmail({})
  } catch (e) {
    own = e
  }
  expect(authErrorMessage(own, "oauth")).toBe("카카오(또는 구글)에서 이메일 제공에 동의해 주세요.")
  expect(authErrorMessage(new Error("boom"), "link")).toBe("요청을 처리하지 못했습니다.")
  expect(authErrorMessage(own, "login")).toBe("요청을 처리하지 못했습니다.")
})
