import { useEffect, useState } from "react"
import { toYmd } from "./monthGrid"

/** 위젯을 며칠씩 켜 두므로 자정이 지나면 오늘 표시를 옮긴다 */
export function useToday() {
  const [today, setToday] = useState(() => toYmd(new Date()))
  useEffect(() => {
    const update = () => setToday(toYmd(new Date()))
    const id = setInterval(update, 60_000)
    window.addEventListener("focus", update)
    return () => {
      clearInterval(id)
      window.removeEventListener("focus", update)
    }
  }, [])
  return today
}
