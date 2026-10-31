import { ClientResponseError } from "pocketbase"
import { openExternal } from "@/features/shell/platform"
import { pb } from "@/lib/pb"
import { AuthNotice } from "./authErrors"

export type Provider = "google" | "kakao"
type Client = Pick<typeof pb, "authStore" | "collection" | "cancelRequest">

const PROVIDERS: Provider[] = ["google", "kakao"]

/** 로그인 수단(비밀번호 + 연결된 소셜)이 해제 후에도 하나 이상 남아야 한다 */
export function canUnlink(linked: Provider[], hasPassword: boolean): boolean {
  return linked.length + (hasPassword ? 1 : 0) > 1
}

export function assertEmail(meta: { email?: string } | undefined): void {
  if (!meta?.email) throw new AuthNotice("카카오(또는 구글)에서 이메일 제공에 동의해 주세요.")
}

// 카카오 기본 scope는 닉네임·프로필 사진까지 요청해 동의항목을 안 켜면 KOE205가 난다. 앱은 이메일만 쓴다
const SCOPES: Partial<Record<Provider, string[]>> = { kakao: ["account_email"] }

const KEY = "oauth2" // 로그인/연결은 동시에 하나만 진행된다
const TIMEOUT_MS = 3 * 60 * 1000

/** 진행 중인 OAuth 흐름을 취소한다. 브라우저를 닫아도 SDK는 알 수 없어서 필요하다 */
export const cancelOAuth = (c: Client = pb) => void c.cancelRequest(KEY)

/** 사용자가 취소했거나 시간 초과로 취소된 경우. 에러 안내 없이 넘어간다 */
export const isOAuthCancelled = (err: unknown) =>
  err instanceof ClientResponseError && err.isAbort

async function oauth(c: Client, provider: Provider) {
  const timer = setTimeout(() => cancelOAuth(c), TIMEOUT_MS)
  try {
    return await c
      .collection("users")
      .authWithOAuth2({
        provider,
        scopes: SCOPES[provider],
        urlCallback: openExternal,
        requestKey: KEY,
      })
  } finally {
    clearTimeout(timer)
  }
}

/** 로그인 안 된 상태. 이메일이 없으면 계정을 남기지 않고 막는다 */
export async function signInWithProvider(provider: Provider, c: Client = pb): Promise<void> {
  const { record, meta } = await oauth(c, provider)
  if (meta?.email) return
  // 본인 레코드 삭제는 인증이 필요하므로 clear 전에 지운다
  // shortcut: 삭제 실패 시 이메일 없는 레코드가 남는다(로그인은 계속 막힘), 쌓이면 서버 정리 작업 추가
  if (meta?.isNew === true) await c.collection("users").delete(record.id).catch(() => {})
  c.authStore.clear()
  assertEmail(meta)
}

/** 로그인된 상태. PB는 현재 계정에 연결하지만, 이미 다른 계정 소유면 그 계정으로 로그인시킨다 */
export async function linkProvider(provider: Provider, c: Client = pb): Promise<void> {
  const { token, record } = c.authStore
  if (!record) throw new AuthNotice("로그인이 필요합니다.")
  const res = await oauth(c, provider)
  if (res.record.id !== record.id) {
    c.authStore.save(token, record)
    throw new AuthNotice("이미 다른 계정에 연결돼 있습니다.")
  }
}

export async function listLinked(c: Client = pb): Promise<Provider[]> {
  const id = c.authStore.record?.id
  if (!id) return []
  const auths = await c.collection("users").listExternalAuths(id)
  return PROVIDERS.filter((p) => auths.some((a) => a.provider === p))
}

export async function unlinkProvider(provider: Provider, c: Client = pb): Promise<void> {
  const rec = c.authStore.record
  if (!rec) throw new AuthNotice("로그인이 필요합니다.")
  // authStore의 레코드는 오래됐을 수 있어 hasPassword는 새로 읽는다
  const { hasPassword } = await c.collection("users").getOne(rec.id)
  if (!canUnlink(await listLinked(c), hasPassword === true))
    throw new AuthNotice("로그인 수단이 하나뿐이라 연결을 해제할 수 없습니다.")
  await c.collection("users").unlinkExternalAuth(rec.id, provider)
}
