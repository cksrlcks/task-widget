import { ClientResponseError, type default as PocketBase } from "pocketbase"

export type BootResult = "authed" | "login" | "offline"

export async function bootAuth(
  client: Pick<PocketBase, "authStore" | "collection">,
): Promise<BootResult> {
  // 웹은 token 없이 쿠키 세션 표시(isValid)만 있다
  if (!client.authStore.token && !client.authStore.isValid) return "login"
  try {
    await client.collection("users").authRefresh()
    return "authed"
  } catch (err) {
    if (err instanceof ClientResponseError) {
      if ([401, 403, 404].includes(err.status)) {
        client.authStore.clear()
        return "login"
      }
      if (err.status === 0) return "offline"
    }
    return "offline"
  }
}
