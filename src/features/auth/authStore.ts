import { load } from "@tauri-apps/plugin-store"
import { AsyncAuthStore, BaseAuthStore } from "pocketbase"
import { isTauri } from "@/features/shell/platform"

const KEY = "pb_auth"

/** 서버가 HttpOnly 쿠키와 함께 심는 표시용 쿠키. 토큰 자체는 스크립트가 볼 수 없다 */
const hasSessionCookie = () =>
  document.cookie.split("; ").includes("pb_session=1")

/**
 * 웹(PWA): 토큰은 서버가 HttpOnly 쿠키로만 다룬다(server/pb_hooks/web_session.pb.js).
 * 여기엔 사용자 정보만 메모리에 두고, token은 늘 비어 있다.
 */
export class CookieAuthStore extends BaseAuthStore {
  constructor(private logoutUrl: string) {
    super()
  }
  get isValid() {
    return !!this.record || hasSessionCookie()
  }
  clear() {
    document.cookie = "pb_session=; Max-Age=0; path=/"
    void fetch(this.logoutUrl, {
      method: "POST",
      headers: { "X-Session": "cookie" },
    }).catch(() => {})
    super.clear()
  }
}

/** 데스크톱: 토큰은 Tauri store 파일에만 저장한다(localStorage 금지). 웹: 쿠키 */
export async function createAuthStore(
  logoutUrl: string,
): Promise<BaseAuthStore> {
  if (!isTauri()) return new CookieAuthStore(logoutUrl)
  const store = await load("auth.json", { defaults: {}, autoSave: false })
  return new AsyncAuthStore({
    save: (v) => store.set(KEY, v).then(() => store.save()),
    initial: (await store.get<string>(KEY)) ?? "",
    clear: () => store.delete(KEY).then(() => store.save()),
  })
}
