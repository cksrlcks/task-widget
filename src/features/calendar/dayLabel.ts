import { DOW } from "./constants"

/** "2026-10-31" → "10월 31일 토요일" */
export const dayLabel = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number)
  return `${m}월 ${d}일 ${DOW[new Date(y, m - 1, d).getDay()]}요일`
}
