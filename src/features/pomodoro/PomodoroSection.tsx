import {
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerSkipForward,
  IconRefresh,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePomodoro } from "./usePomodoro"

type Props = { className?: string }

export function PomodoroSection({ className }: Props) {
  const p = usePomodoro()
  const { phase, round, status } = p.state
  const label =
    phase === "focus"
      ? `집중 ${round}/${p.longBreakEvery}`
      : phase === "short"
        ? "짧은 휴식"
        : "긴 휴식"
  const secs = Math.ceil(p.remainingMs / 1000)
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`
  const running = status === "running"

  return (
    <section className={cn("flex flex-col items-center gap-2 p-3", className)}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-5xl font-semibold tabular-nums">{mmss}</div>
      <div className="flex gap-2">
        {status === "done" ? (
          <Button onClick={p.next}>
            {phase === "focus" ? "휴식 시작하기" : "집중 시작하기"}
          </Button>
        ) : (
          <Button
            size="icon"
            aria-label={running ? "일시정지" : "시작"}
            onClick={running ? p.pause : p.start}
          >
            {running ? <IconPlayerPause /> : <IconPlayerPlay />}
          </Button>
        )}
        <Button size="icon" variant="outline" aria-label="리셋" onClick={p.reset}>
          <IconRefresh />
        </Button>
        <Button size="icon" variant="outline" aria-label="건너뛰기" onClick={p.skip}>
          <IconPlayerSkipForward />
        </Button>
      </div>
    </section>
  )
}
