import { useEffect, useSyncExternalStore } from "react"
import type { RecordModel } from "pocketbase"
import { isTauri } from "@/features/shell/platform"
import { pb } from "@/lib/pb"
import { shouldRefresh } from "./authExpiry"
import { bootAuth, type BootResult } from "./bootAuth"

let boot: BootResult | "loading" = "loading"
let inFlight = false // StrictMode 이중 마운트에서 authRefresh 두 번 방지
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** 앱 시작/다시 시도. 토큰 검증 결과를 boot에 반영 */
export function runBoot() {
  if (inFlight) return
  inFlight = true
  boot = "loading"
  emit()
  void bootAuth(pb).then((r) => {
    inFlight = false
    boot = r
    emit()
  })
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  const off = pb.authStore.onChange(l)
  return () => {
    listeners.delete(l)
    off()
  }
}

export function useAuth(): {
  user: RecordModel | null
  status: BootResult | "loading"
  logout(): void
} {
  const user = useSyncExternalStore(subscribe, () => pb.authStore.record)
  const b = useSyncExternalStore(subscribe, () => boot)
  useEffect(() => {
    if (boot === "loading") runBoot()
  }, [])
  // 부팅이 끝난 뒤에는 로그인/로그아웃을 authStore 변화로 따라간다
  const status = b === "loading" || b === "offline" ? b : user ? "authed" : "login"
  return { user, status, logout: () => pb.authStore.clear() }
}

const AUTH_EVENT = "auth:changed"
type AuthPayload = { token: string; record: RecordModel | null } | null

/** 설정 창에서 로그아웃/연결한 결과를 위젯 창에 알린다 */
export async function broadcastAuth() {
  if (!isTauri()) return
  const { emit } = await import("@tauri-apps/api/event")
  const payload: AuthPayload = pb.authStore.token
    ? { token: pb.authStore.token, record: pb.authStore.record }
    : null
  await emit(AUTH_EVENT, payload)
}

let refreshing = false
/** 오래 켜 두는 위젯용: 만료가 가까우면 갱신. 401/403이면 bootAuth가 토큰을 지워 로그인 화면으로 간다 */
function keepAlive() {
  if (inFlight || refreshing || !shouldRefresh(pb.authStore.token, Date.now())) return
  refreshing = true
  void bootAuth(pb).finally(() => (refreshing = false))
}

/** 위젯 창에서 한 번: 토큰 주기 갱신 + 다른 창의 로그인 상태 반영 */
export function startAuthSession() {
  setInterval(keepAlive, 10 * 60_000)
  window.addEventListener("focus", keepAlive)
  if (!isTauri()) return
  void import("@tauri-apps/api/event").then(({ listen }) =>
    listen<AuthPayload>(AUTH_EVENT, ({ payload }) => {
      if (payload) pb.authStore.save(payload.token, payload.record)
      else pb.authStore.clear()
    }),
  )
}
