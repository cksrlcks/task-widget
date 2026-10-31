import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { IconLock, IconMail } from "@tabler/icons-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { useDesktopDownload } from "@/features/download/useDesktopDownload"
import { pb } from "@/lib/pb"
import { authErrorMessage } from "./authErrors"
import {
  AuthHeader,
  bigButton,
  Field,
  FormError,
  OrDivider,
  SocialButton,
} from "./authUi"
import {
  cancelOAuth,
  isOAuthCancelled,
  signInWithProvider,
  type Provider,
} from "./oauth"
import { ResetForm } from "./ResetForm"
import { SignupForm } from "./SignupForm"

const schema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
})
type FormValues = z.infer<typeof schema>

export function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login")
  // 진행 중인 소셜 로그인
  const [oauth, setOauth] = useState<Provider | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (v: FormValues) => {
    try {
      await pb.collection("users").authWithPassword(v.email, v.password)
    } catch (err) {
      setError("root", { message: authErrorMessage(err, "login") })
    }
  }

  const social = async (p: Provider) => {
    setOauth(p)
    try {
      await signInWithProvider(p)
    } catch (err) {
      if (!isOAuthCancelled(err))
        setError("root", { message: authErrorMessage(err, "oauth") })
    } finally {
      setOauth(null)
    }
  }

  const download = useDesktopDownload()
  const back = () => setMode("login")
  if (mode === "signup") return <SignupForm onBack={back} />
  if (mode === "reset") return <ResetForm onBack={back} />

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-3.5 px-4 pt-3 pb-4">
      <AuthHeader title="Task Widget" desc="할 일, 일정, 뽀모도로를 한곳에서" />
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
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          icon={<IconLock />}
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="-mt-1 flex justify-end">
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            onClick={() => setMode("reset")}
          >
            비밀번호를 잊으셨나요?
          </button>
        </div>
        <FormError>{errors.root?.message}</FormError>
        <Button
          type="submit"
          disabled={isSubmitting || !!oauth}
          className={bigButton}
        >
          {isSubmitting ? "로그인 중…" : "로그인"}
        </Button>
      </form>
      <OrDivider />
      <div className="flex flex-col gap-1.5">
        {(["google", "kakao"] as const).map((p) => (
          <SocialButton
            key={p}
            provider={p}
            busy={oauth === p}
            disabled={!!oauth || isSubmitting}
            onClick={() => void social(p)}
          />
        ))}
        {oauth && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            onClick={() => cancelOAuth()}
          >
            브라우저에서 로그인 중… 취소
          </button>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        계정이 없으신가요?{" "}
        <button
          type="button"
          className="font-semibold text-primary hover:underline"
          onClick={() => setMode("signup")}
        >
          회원가입
        </button>
      </p>
      {download && (
        <a
          href={download.url}
          className="-mt-1 self-center text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          {download.label} — 바탕화면 위젯으로 쓰기
        </a>
      )}
    </div>
  )
}
