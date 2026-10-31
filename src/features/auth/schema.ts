import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
})
export type LoginValues = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    email: z.string().email("올바른 이메일을 입력하세요"),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "비밀번호가 일치하지 않습니다",
  })
export type SignupValues = z.infer<typeof signupSchema>

export const resetSchema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
})
export type ResetValues = z.infer<typeof resetSchema>
