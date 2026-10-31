import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLock, IconMail } from "@tabler/icons-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { pb } from "@/lib/pb"
import { authErrorMessage } from "./authErrors"
import { AuthHeader, BackLink, bigButton, Field, FormError } from "./authUi"

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
    } catch (err) {
      return setError("root", { message: authErrorMessage(err, "signup") })
    }
    try {
      await pb.collection("users").requestVerification(v.email)
      setSent(true)
    } catch {
      setError("root", {
        message:
          "가입은 완료됐지만 인증 메일을 보내지 못했습니다. 로그인 화면의 비밀번호 찾기로 다시 시도하세요.",
      })
    }
  }

  if (sent)
    return (
      <div className="mx-auto flex w-full max-w-xs flex-col gap-3.5 px-4 pt-3 pb-4">
        <AuthHeader
          title="메일을 확인하세요"
          desc="인증 메일의 링크를 누른 뒤 로그인하세요."
        />
        <Button onClick={onBack} className={bigButton}>
          로그인으로 돌아가기
        </Button>
      </div>
    )

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-3.5 px-4 pt-3 pb-4">
      <AuthHeader
        title="계정 만들기"
        desc="이메일로 가입하고 인증 메일을 받습니다"
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
        noValidate
      >
        <Field
          label="이메일"
          type="email"
          autoComplete="email"
          icon={<IconMail />}
          error={errors.email?.message}
          {...register("email")}
        />
        <Field
          label="비밀번호 (8자 이상)"
          type="password"
          autoComplete="new-password"
          icon={<IconLock />}
          error={errors.password?.message}
          {...register("password")}
        />
        <Field
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          icon={<IconLock />}
          error={errors.passwordConfirm?.message}
          {...register("passwordConfirm")}
        />
        <FormError>{errors.root?.message}</FormError>
        <Button type="submit" disabled={isSubmitting} className={bigButton}>
          {isSubmitting ? "가입 중…" : "가입하기"}
        </Button>
      </form>
      <BackLink onBack={onBack} />
    </div>
  )
}
