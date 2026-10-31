import PocketBase from "pocketbase"
import { createAuthStore } from "@/features/auth/authStore"

export const pb = new PocketBase(import.meta.env.VITE_PB_URL)

/** 렌더 전에 한 번. 저장된 토큰을 읽어 authStore를 교체한다 */
export async function initPb() {
  pb.authStore = await createAuthStore()
}
