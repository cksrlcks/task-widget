import { useEffect, useSyncExternalStore } from "react"
import type { RecordModel } from "pocketbase"
import { pb } from "@/lib/pb"
import { bootAuth, type BootResult } from "./bootAuth"

let boot: BootResult | "loading" = "loading"
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** 앱 시작/다시 시도. 토큰 검증 결과를 boot에 반영 */
export function runBoot() {
  boot = "loading"
  emit()
  void bootAuth(pb).then((r) => {
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
