import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconRefresh,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { WidgetCard } from "@/features/widget/WidgetCard"
import { cn } from "@/lib/utils"
import { PomodoroBar } from "./PomodoroBar"
import { usePomodoro } from "./usePomodoro"

type Props = { className?: string }

const QUICK_MIN = [15, 25, 40, 60]

export function PomodoroSection({ className }: Props) {
  const p = usePomodoro()
  const running = p.state.status === "running"
  const secs = Math.ceil(p.remainingMs / 1000)
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`

  return (
    <WidgetCard className={cn("gap-2.5 p-3", className)}>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-3xl font-semibold tracking-tight tabular-nums transition-opacity",
            !running && "opacity-70",
          )}
        >
          {mmss}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            aria-label="리셋"
            onClick={p.reset}
            className="size-8 rounded-full bg-foreground/5 p-0 text-muted-foreground transition-transform hover:bg-foreground/10 hover:text-foreground active:scale-95"
          >
            <IconRefresh />
          </Button>
          <Button
            variant="ghost"
            aria-label={running ? "일시정지" : "시작"}
            onClick={running ? p.pause : p.start}
            className="size-8 rounded-full bg-linear-to-br from-[#e040fb] to-[#ff7a50] p-0 text-white shadow-sm shadow-[#e040fb]/30 transition-transform hover:text-white hover:brightness-110 active:scale-95"
          >
            {running ? <IconPlayerPauseFilled /> : <IconPlayerPlayFilled />}
          </Button>
        </div>
      </div>
      <PomodoroBar
        remainingMs={p.remainingMs}
        durationMs={p.state.durationMs}
        dim={!running}
        onSet={running ? undefined : p.setMinutes}
      />
      <div className="grid grid-cols-4 gap-1.5">
        {QUICK_MIN.map((m) => (
          <Button
            key={m}
            variant="ghost"
            aria-pressed={p.state.durationMs === m * 60_000}
            disabled={running}
            onClick={() => p.setMinutes(m)}
            className="h-8 rounded-full bg-foreground/5 text-muted-foreground tabular-nums hover:bg-foreground/10 aria-pressed:bg-[#e040fb]/10 aria-pressed:font-semibold aria-pressed:text-[#c026d3]"
          >
            {m}분
          </Button>
        ))}
      </div>
    </WidgetCard>
  )
}
