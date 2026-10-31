import { ClientResponseError } from "pocketbase"

export type AuthCtx = "login" | "signup" | "oauth" | "link"

export function authErrorMessage(err: unknown, ctx: AuthCtx): string {
  if (!(err instanceof ClientResponseError)) return "요청을 처리하지 못했습니다."
  if (err.status === 0) return "서버에 연결할 수 없습니다."
  if (ctx === "signup" && err.response?.data?.email?.code === "validation_not_unique")
    return "이미 가입된 이메일입니다. 구글/카카오로 로그인하거나 비밀번호 찾기로 비밀번호를 만드세요."
  if (ctx === "login" && (err.status === 400 || err.status === 403))
    return "이메일 또는 비밀번호가 맞지 않거나, 아직 이메일 인증을 하지 않았습니다."
  return "요청을 처리하지 못했습니다."
}
