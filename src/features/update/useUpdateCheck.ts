import { useEffect, useState } from "react"
import type { Update } from "@tauri-apps/plugin-updater"
import { toast } from "sonner"
import { isTauri } from "@/features/shell/platform"

const DELAY_MS = 30_000
const EVERY_MS = 6 * 60 * 60_000

/**
 * 위젯 창에서 한 번 호출한다. 시작 30초 뒤, 그 뒤로 6시간마다 확인하고 실패는 콘솔에만 남긴다.
 * 새 버전이 있으면 update를 돌려주고, 헤더의 업데이트 버튼이 install을 부른다
 */
export function useUpdateCheck() {
  const [update, setUpdate] = useState<Update | null>(null)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    if (!isTauri()) return
    const check = async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater")
        setUpdate(await check())
      } catch (err) {
        console.error("update check failed", err)
      }
    }
    const first = setTimeout(check, DELAY_MS)
    const again = setInterval(check, EVERY_MS)
    return () => {
      clearTimeout(first)
      clearInterval(again)
    }
  }, [])

  const install = async () => {
    if (!update || installing) return
    setInstalling(true)
    try {
      await update.downloadAndInstall()
      const { relaunch } = await import("@tauri-apps/plugin-process")
      await relaunch()
    } catch (err) {
      setInstalling(false)
      toast.error(
        err instanceof Error ? err.message : "업데이트하지 못했습니다",
      )
    }
  }

  return { update, installing, install }
}
