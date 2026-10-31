import { ClientResponseError, type default as PocketBase } from "pocketbase"

export type BootResult = "authed" | "login" | "offline"

export async function bootAuth(
  client: Pick<PocketBase, "authStore" | "collection">,
): Promise<BootResult> {
  if (!client.authStore.token) return "login"
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
