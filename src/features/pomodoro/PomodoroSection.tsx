import {
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerSkipForward,
  IconRefresh,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { WidgetCard } from "@/features/widget/WidgetCard"
import { cn } from "@/lib/utils"
import { PomodoroDial } from "./PomodoroDial"
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
  const running = status === "running"

  return (
    <WidgetCard
      className={cn("items-center gap-1 px-3 pt-3 pb-3.5", className)}
    >
      <PomodoroDial
        remainingMs={p.remainingMs}
        durationMs={p.state.durationMs}
        phase={phase}
        label={label}
        dim={!running}
        className="w-full max-w-[220px]"
      />
      <div className="flex gap-1.5">
        {status === "done" ? (
          <Button
            onClick={() => {
              p.next()
              p.start()
            }}
          >
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
        <Button
          size="icon"
          variant="outline"
          aria-label="리셋"
          onClick={p.reset}
        >
          <IconRefresh />
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label="건너뛰기"
          onClick={p.skip}
        >
          <IconPlayerSkipForward />
        </Button>
      </div>
    </WidgetCard>
  )
}
