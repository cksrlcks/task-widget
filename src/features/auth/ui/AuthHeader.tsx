import type { ReactNode } from "react"

/** 로그인·가입·재설정 화면 위쪽: 앱 아이콘, 제목, 한 줄 설명 */
export function AuthHeader({
  title,
  desc,
}: {
  title: string
  desc?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 pt-2 pb-1 text-center">
      <img
        src="/icons/icon-192.png"
        alt=""
        draggable={false}
        className="size-12 rounded-[15px] shadow-[0_4px_12px_rgb(10_99_201/.26)]"
      />
      <h1 className="mt-0.5 text-base font-semibold tracking-tight">{title}</h1>
      {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
    </div>
  )
}
