import type { CalEvent } from "./type"

const p2 = (n: number) => String(n).padStart(2, "0")

export const toYmd = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`

// "YYYY-MM" 에서 delta 개월 이동
export function shiftMonth(ym: string, delta: number) {
  const d = new Date(Number(ym.slice(0, 4)), Number(ym.slice(5)) - 1 + delta, 1)
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}`
}

// 일요일 시작, 항상 6주(42칸)
export function monthGrid(year: number, month: number) {
  const start = new Date(year, month - 1, 1 - new Date(year, month - 1, 1).getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    return { ymd: toYmd(d), inMonth: d.getMonth() === month - 1 }
  })
}

// 종일("") 먼저, 그다음 시간 오름차순 (HH:mm 은 문자열 비교로 충분)
export const sortDayEvents = (events: CalEvent[]) =>
  [...events].sort((a, b) => a.time.localeCompare(b.time))
