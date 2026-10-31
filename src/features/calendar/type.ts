export type CalEvent = {
  id: string
  title: string
  date: string
  time: string
  memo: string
}

export type EventInput = Pick<CalEvent, "title" | "date" | "time" | "memo">
