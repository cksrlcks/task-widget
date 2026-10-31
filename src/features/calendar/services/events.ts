import { pb } from "@/lib/pb"
import type { CalEvent, EventInput } from "../type"

// 백엔드(PocketBase) 호출은 여기서만. 백엔드를 바꾸면 이 파일만 고친다
const events = () => pb.collection("events")

/** ym: "2026-10" */
export const listMonthEvents = (ym: string) =>
  events().getFullList<CalEvent>({
    filter: pb.filter("date ~ {:p}", { p: `${ym}-%` }),
    sort: "date,time",
  })

export const createEvent = (v: EventInput) => {
  const user = pb.authStore.record?.id
  if (!user) throw new Error("로그인이 필요합니다.")
  return events().create({ ...v, user })
}

export const updateEvent = (id: string, data: Partial<EventInput>) =>
  events().update(id, data)

export const deleteEvent = (id: string) => events().delete(id)
