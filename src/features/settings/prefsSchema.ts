import { z } from "zod"

const int = (min: number, max: number) =>
  z.coerce
    .number({ message: "숫자를 입력해 주세요" })
    .int("정수만 입력할 수 있습니다")
    .min(min, `${min} 이상 ${max} 이하로 입력해 주세요`)
    .max(max, `${min} 이상 ${max} 이하로 입력해 주세요`)

export const minutesSchema = int(1, 120)
export const everySchema = int(1, 10)

/** 입력 문자열을 검사한다. 통과하면 값, 아니면 안내 문구 */
export function parseField(
  schema: typeof minutesSchema,
  raw: string,
): { value: number } | { error: string } {
  if (raw.trim() === "") return { error: "숫자를 입력해 주세요" }
  const r = schema.safeParse(raw)
  return r.success
    ? { value: r.data }
    : { error: r.error.issues[0]?.message ?? "올바르지 않은 값입니다" }
}
