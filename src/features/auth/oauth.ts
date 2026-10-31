import { openExternal } from "@/features/shell/platform"
import { pb } from "@/lib/pb"
import { AuthNotice } from "./authErrors"

export type Provider = "google" | "kakao"
type Client = Pick<typeof pb, "authStore" | "collection">

const PROVIDERS: Provider[] = ["google", "kakao"]

/** 로그인 수단(비밀번호 + 연결된 소셜)이 해제 후에도 하나 이상 남아야 한다 */
export function canUnlink(linked: Provider[], hasPassword: boolean): boolean {
  return linked.length + (hasPassword ? 1 : 0) > 1
}

export function assertEmail(meta: { email?: string } | undefined): void {
  if (!meta?.email) throw new AuthNotice("카카오(또는 구글)에서 이메일 제공에 동의해 주세요.")
}

const oauth = (c: Client, provider: Provider) =>
  c.collection("users").authWithOAuth2({ provider, urlCallback: openExternal })

/** 로그인 안 된 상태. 이메일이 없으면 계정을 남기지 않고 막는다 */
export async function signInWithProvider(provider: Provider, c: Client = pb): Promise<void> {
  const { record, meta } = await oauth(c, provider)
  if (meta?.email) return
  // 본인 레코드 삭제는 인증이 필요하므로 clear 전에 지운다
  try {
    if (meta?.isNew === true) await c.collection("users").delete(record.id)
  } finally {
    c.authStore.clear()
  }
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

export async function listLinked(): Promise<Provider[]> {
  const id = pb.authStore.record?.id
  if (!id) return []
  const auths = await pb.collection("users").listExternalAuths(id)
  return PROVIDERS.filter((p) => auths.some((a) => a.provider === p))
}

export async function unlinkProvider(provider: Provider): Promise<void> {
  const rec = pb.authStore.record
  if (!rec) throw new AuthNotice("로그인이 필요합니다.")
  if (!canUnlink(await listLinked(), rec.hasPassword === true))
    throw new AuthNotice("로그인 수단이 하나뿐이라 연결을 해제할 수 없습니다.")
  await pb.collection("users").unlinkExternalAuth(rec.id, provider)
}
