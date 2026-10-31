import { load } from "@tauri-apps/plugin-store"
import { AsyncAuthStore } from "pocketbase"

const KEY = "pb_auth"

/** 토큰은 Tauri store 파일에만 저장한다(localStorage 금지) */
export async function createAuthStore(): Promise<AsyncAuthStore> {
  const store = await load("auth.json", { defaults: {}, autoSave: false })
  return new AsyncAuthStore({
    save: (v) => store.set(KEY, v).then(() => store.save()),
    initial: (await store.get<string>(KEY)) ?? "",
    clear: () => store.delete(KEY).then(() => store.save()),
  })
}
