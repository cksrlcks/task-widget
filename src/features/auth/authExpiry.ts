import { ClientResponseError, getTokenPayload } from "pocketbase"

/** 만료 하루 전부터 갱신한다 */
const REFRESH_BEFORE_MS = 24 * 60 * 60_000

export function shouldRefresh(token: string, now: number): boolean {
  if (!token) return false
  const exp = getTokenPayload(token).exp
  return typeof exp !== "number" || exp * 1000 - now < REFRESH_BEFORE_MS
}

/** 다시 로그인해야 하는 응답인가. 네트워크 오류(status 0)는 로그아웃하지 않는다 */
export function isSessionLost(err: unknown, tokenValid: boolean): boolean {
  if (!(err instanceof ClientResponseError)) return false
  return err.status === 401 || (err.status === 403 && !tokenValid)
}
