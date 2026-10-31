import PocketBase from "pocketbase"
import { createAuthStore } from "@/features/auth/authStore"
import { isTauri } from "@/features/shell/platform"

// 웹은 PocketBase와 같은 주소에서 서비스한다(VITE_PB_URL=/)
export const pb = new PocketBase(import.meta.env.VITE_PB_URL)

/** 렌더 전에 한 번. 저장된 토큰을 읽어 authStore를 교체한다 */
export async function initPb() {
  pb.authStore = await createAuthStore(pb.buildURL("/api/web/logout"))
  if (isTauri()) return
  // 서버가 이 표시를 보고 쿠키로 인증한다
  pb.beforeSend = (url, options) => {
    options.headers = { ...options.headers, "X-Session": "cookie" }
    return { url, options }
  }
}
