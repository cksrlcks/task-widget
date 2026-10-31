import { useEffect } from "react"
import { toast } from "sonner"
import { isTauri } from "@/features/shell/platform"

const DELAY_MS = 30_000

/** 위젯 창에서만 호출한다. 시작 30초 뒤 한 번 확인하고, 실패는 콘솔에만 남긴다 */
export function useUpdateCheck() {
  useEffect(() => {
    if (!isTauri()) return
    const timer = setTimeout(async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater")
        const update = await check()
        if (!update) return
        toast("새 버전이 있습니다", {
          description: `v${update.version}`,
          duration: Infinity,
          action: {
            label: "업데이트",
            onClick: () => {
              void (async () => {
                try {
                  await update.downloadAndInstall()
                  const { relaunch } = await import("@tauri-apps/plugin-process")
                  await relaunch()
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "업데이트하지 못했습니다")
                }
              })()
            },
          },
        })
      } catch (err) {
        console.error("update check failed", err)
      }
    }, DELAY_MS)
    return () => clearTimeout(timer)
  }, [])
}
