import { cn } from "@/lib/utils"
import { arc, at, C, R, SEGS } from "./dialGeometry"

type Props = {
  /** 남은 시간(ms) */
  remainingMs: number
  /** 이번 단계 전체 길이(ms). 60분 이하면 다이얼 한 바퀴 = 60분, 넘으면 120분 */
  durationMs: number
  /** 집중은 빨강, 휴식은 초록 */
  phase: "focus" | "short" | "long"
  /** 고리 가운데 위·아래 글자 */
  label: string
  dim?: boolean
  className?: string
}

/** 타임 타이머 모양 다이얼: 바깥 분 눈금, 남은 시간만큼 칸으로 나뉜 고리, 가운데 디지털 시간 */
export function PomodoroDial({
  remainingMs,
  durationMs,
  phase,
  label,
  dim,
  className,
}: Props) {
  const scaleMin = durationMs <= 60 * 60_000 ? 60 : 120
  const step = scaleMin / 12 // 숫자 간격(분)
  const left = remainingMs / 60_000 / (scaleMin / SEGS) // 남은 칸 수(소수)
  const secs = Math.ceil(remainingMs / 1000)
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`
  const deg = 360 / SEGS
  const gap = 0.9

  return (
    <svg
      viewBox="0 0 220 220"
      role="img"
      aria-label={`${label} ${mmss} 남음`}
      className={cn(
        "select-none",
        phase === "focus" ? "text-[#e5484d]" : "text-[#30a46c]",
        className,
      )}
    >
      {Array.from({ length: SEGS }, (_, i) => {
        const from = i * deg + gap
        const to = (i + 1) * deg - gap
        const fill = Math.min(1, Math.max(0, left - i)) // 이 칸이 남은 정도
        return (
          <g key={i}>
            <path
              d={arc(R, from, to)}
              className="stroke-foreground/[.07]"
              strokeWidth={16}
              fill="none"
            />
            {fill > 0 && (
              <path
                d={arc(R, from, from + (to - from) * fill)}
                stroke="currentColor"
                strokeOpacity={dim ? 0.45 : 1}
                strokeWidth={16}
                fill="none"
              />
            )}
          </g>
        )
      })}
      {/* 바깥 분 눈금: 큰 눈금 + 숫자 */}
      {Array.from({ length: 12 }, (_, i) => {
        const [x1, y1] = at(R + 11, i * 30)
        const [x2, y2] = at(R + 15, i * 30)
        const [tx, ty] = at(R + 25, i * 30)
        return (
          <g key={i} className="text-foreground/60">
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={1.2}
            />
            <text
              x={tx}
              y={ty}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              fill="currentColor"
              className="tabular-nums"
            >
              {i * step}
            </text>
          </g>
        )
      })}
      <text
        x={C}
        y={C - 22}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        className="fill-muted-foreground font-medium"
      >
        {label}
      </text>
      <text
        x={C}
        y={C + 4}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={34}
        className="fill-foreground font-semibold tabular-nums"
        letterSpacing={-0.5}
      >
        {mmss}
      </text>
    </svg>
  )
}
