import { useRef, type PointerEvent } from "react"
import { cn } from "@/lib/utils"
import { fracToMin, TICKS } from "./barScale"

type Props = {
  /** 남은 시간(ms) */
  remainingMs: number
  /** 전체 길이(ms). 60분 이하면 막대 전체 = 60분, 넘으면 120분 */
  durationMs: number
  dim?: boolean
  /** 주면 막대를 끌거나 방향키로 시간(분)을 맞출 수 있다 */
  onSet?: (min: number) => void
  className?: string
}

/** 세로 눈금 막대: 남은 시간만큼 왼쪽부터 그라데이션으로 켜진다 */
export function PomodoroBar({
  remainingMs,
  durationMs,
  dim,
  onSet,
  className,
}: Props) {
  // 드래그 중엔 배율을 고정한다(120→60분으로 바뀌며 눈금이 튀지 않게)
  const dragScale = useRef<number | null>(null)
  const scaleMin =
    dragScale.current ?? (durationMs <= 60 * 60_000 ? 60 : 120)
  const curMin = Math.round(remainingMs / 60_000)
  const lit = Math.ceil(remainingMs / 60_000 / (scaleMin / TICKS))

  const setFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    onSet?.(fracToMin((e.clientX - r.left) / r.width, scaleMin))
  }

  return (
    <div
      role={onSet ? "slider" : "img"}
      aria-label={`남은 시간 ${curMin}분`}
      {...(onSet && {
        tabIndex: 0,
        "aria-valuemin": 1,
        "aria-valuemax": scaleMin,
        "aria-valuenow": curMin,
        "aria-valuetext": `${curMin}분`,
        onKeyDown: (e) => {
          const step =
            e.key === "ArrowUp" || e.key === "ArrowRight"
              ? 1
              : e.key === "ArrowDown" || e.key === "ArrowLeft"
                ? -1
                : 0
          if (!step) return
          e.preventDefault()
          onSet(Math.min(scaleMin, Math.max(1, curMin + step)))
        },
        onPointerDown: (e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          dragScale.current = scaleMin
          setFromPointer(e)
        },
        onPointerMove: (e) => {
          if (dragScale.current != null) setFromPointer(e)
        },
        onPointerUp: () => (dragScale.current = null),
        onPointerCancel: () => (dragScale.current = null),
      })}
      className={cn(
        "flex h-9 items-stretch justify-between rounded-md py-1 select-none",
        onSet &&
          "cursor-ew-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      {Array.from({ length: TICKS }, (_, i) => (
        <span
          key={i}
          className={cn(
            "w-[2px] rounded-full transition-colors",
            i >= lit && "bg-foreground/10",
          )}
          style={
            i < lit
              ? {
                  // 왼쪽 분홍 → 오른쪽 주황
                  background: `color-mix(in oklch, #e040fb, #ff7a50 ${(i / (TICKS - 1)) * 100}%)`,
                  opacity: dim ? 0.5 : 1,
                }
              : undefined
          }
        />
      ))}
    </div>
  )
}
