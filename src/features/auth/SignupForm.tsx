import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { pb } from "@/lib/pb"
import { authErrorMessage } from "./authErrors"

const schema = z
  .object({
    email: z.string().email("올바른 이메일을 입력하세요"),
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "비밀번호가 일치하지 않습니다",
  })
type FormValues = z.infer<typeof schema>

type Props = { onBack: () => void }

export function SignupForm({ onBack }: Props) {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (v: FormValues) => {
    try {
      await pb.collection("users").create({ ...v, hasPassword: true })
      await pb.collection("users").requestVerification(v.email)
      setSent(true)
    } catch (err) {
      setError("root", { message: authErrorMessage(err, "signup") })
    }
  }

  if (sent)
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p>인증 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요.</p>
        <Button onClick={onBack}>로그인으로 돌아가기</Button>
      </div>
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Input type="email" placeholder="이메일" {...register("email")} />
      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      <Input type="password" placeholder="비밀번호 (8자 이상)" {...register("password")} />
      {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      <Input type="password" placeholder="비밀번호 확인" {...register("passwordConfirm")} />
      {errors.passwordConfirm && (
        <p className="text-xs text-destructive">{errors.passwordConfirm.message}</p>
      )}
      {errors.root && <p className="text-xs text-destructive">{errors.root.message}</p>}
      <Button type="submit" disabled={isSubmitting}>회원가입</Button>
      <Button type="button" variant="outline" onClick={onBack}>취소</Button>
    </form>
  )
}
