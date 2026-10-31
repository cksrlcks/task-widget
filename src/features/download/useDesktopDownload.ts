import { useQuery } from "@tanstack/react-query"
import { isTauri } from "@/features/shell/platform"

const REPO = "cksrlcks/task-widget"
const RELEASES = `https://github.com/${REPO}/releases/latest`

type Os = "windows" | "mac"

/** 웹에서 접속한 기기의 데스크톱 OS. 휴대폰·태블릿·리눅스는 앱이 없어 null */
export function detectOs(ua: string): Os | null {
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return null
  if (/Windows/i.test(ua)) return "windows"
  if (/Macintosh|Mac OS X/i.test(ua)) return "mac"
  return null
}

/** 릴리스 첨부 파일 중 그 OS의 설치 파일(Windows: -setup.exe, 맥: .dmg) */
export function pickAsset(names: string[], os: Os): string | undefined {
  return names.find((n) =>
    os === "windows" ? /-setup\.exe$/i.test(n) : /\.dmg$/i.test(n),
  )
}

/**
 * 웹에서만: 이 기기에 맞는 데스크톱 앱 다운로드 링크. 최신 릴리스에서 파일을 찾고,
 * 못 찾거나 GitHub에 못 닿으면 릴리스 페이지로 보낸다
 */
export function useDesktopDownload(): { label: string; url: string } | null {
  const os = isTauri() ? null : detectOs(navigator.userAgent)
  const { data } = useQuery({
    queryKey: ["latest-release", os],
    enabled: !!os,
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      const res = await fetch(
        `https://api.github.com/repos/${REPO}/releases/latest`,
      )
      if (!res.ok) return null
      const json: { assets: { name: string; browser_download_url: string }[] } =
        await res.json()
      const name = pickAsset(
        json.assets.map((a) => a.name),
        os!,
      )
      return (
        json.assets.find((a) => a.name === name)?.browser_download_url ?? null
      )
    },
  })
  if (!os) return null
  return {
    label: os === "windows" ? "Windows 앱 받기" : "Mac 앱 받기",
    url: data ?? RELEASES,
  }
}
