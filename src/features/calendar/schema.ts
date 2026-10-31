import { z } from "zod"

export const eventSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요.").max(200),
  time: z.string().regex(/^$|^\d{2}:\d{2}$/, "시간 형식이 올바르지 않습니다."),
  memo: z.string().max(2000),
})
export type EventFormValues = z.infer<typeof eventSchema>
