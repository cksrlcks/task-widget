import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconMail } from "@tabler/icons-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { pb } from "@/lib/pb"
import { authErrorMessage } from "./authErrors"
import { AuthHeader, BackLink, bigButton, Field, FormError } from "./authUi"

const schema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
})
type FormValues = z.infer<typeof schema>

type Props = { onBack: () => void }

export function ResetForm({ onBack }: Props) {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (v: FormValues) => {
    try {
      await pb.collection("users").requestPasswordReset(v.email)
      setSent(true)
    } catch (err) {
      setError("root", { message: authErrorMessage(err, "link") })
    }
  }

  if (sent)
    return (
      <div className="mx-auto flex w-full max-w-xs flex-col gap-3.5 px-4 pt-3 pb-4">
        <AuthHeader
          title="메일을 보냈어요"
          desc="메일의 링크에서 새 비밀번호를 정하세요."
        />
        <Button onClick={onBack} className={bigButton}>
          로그인으로 돌아가기
        </Button>
      </div>
    )

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-3.5 px-4 pt-3 pb-4">
      <AuthHeader
        title="비밀번호 찾기"
        desc="가입한 이메일로 재설정 링크를 보내 드려요"
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
        noValidate
      >
        <Field
          label="가입한 이메일"
          type="email"
          autoComplete="email"
          icon={<IconMail />}
          error={errors.email?.message}
          {...register("email")}
        />
        <FormError>{errors.root?.message}</FormError>
        <Button type="submit" disabled={isSubmitting} className={bigButton}>
          {isSubmitting ? "보내는 중…" : "재설정 메일 보내기"}
        </Button>
      </form>
      <BackLink onBack={onBack} />
    </div>
  )
}
