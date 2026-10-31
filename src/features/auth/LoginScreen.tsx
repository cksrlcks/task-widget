import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { pb } from "@/lib/pb"
import { authErrorMessage } from "./authErrors"
import { cancelOAuth, isOAuthCancelled, signInWithProvider, type Provider } from "./oauth"
import { ResetForm } from "./ResetForm"
import { SignupForm } from "./SignupForm"

const schema = z.object({
  email: z.string().email("올바른 이메일을 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
})
type FormValues = z.infer<typeof schema>

export function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login")
  const [oauthBusy, setOauthBusy] = useState(false)
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
    setOauthBusy(true)
    try {
      await signInWithProvider(p)
    } catch (err) {
      if (!isOAuthCancelled(err)) setError("root", { message: authErrorMessage(err, "oauth") })
    } finally {
      setOauthBusy(false)
    }
  }

  const back = () => setMode("login")
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-3 p-4">
      <h1 className="text-lg font-semibold">Task Widget</h1>
      {mode === "signup" ? (
        <SignupForm onBack={back} />
      ) : mode === "reset" ? (
        <ResetForm onBack={back} />
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
            <label htmlFor="login-email" className="sr-only">
              이메일
            </label>
            <Input id="login-email" type="email" placeholder="이메일" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            <label htmlFor="login-password" className="sr-only">
              비밀번호
            </label>
            <Input
              id="login-password"
              type="password"
              placeholder="비밀번호"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
            {errors.root && <p className="text-xs text-destructive">{errors.root.message}</p>}
            <Button type="submit" disabled={isSubmitting}>로그인</Button>
          </form>
          <Button variant="outline" disabled={oauthBusy} onClick={() => social("google")}>
            구글로 계속하기
          </Button>
          <Button variant="outline" disabled={oauthBusy} onClick={() => social("kakao")}>
            카카오로 계속하기
          </Button>
          {oauthBusy && (
            <Button variant="ghost" onClick={() => cancelOAuth()}>
              취소
            </Button>
          )}
          <div className="flex justify-between text-xs">
            <button type="button" className="underline" onClick={() => setMode("signup")}>
              회원가입
            </button>
            <button type="button" className="underline" onClick={() => setMode("reset")}>
              비밀번호 찾기
            </button>
          </div>
        </>
      )}
    </div>
  )
}
