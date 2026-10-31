import { useState, type ComponentProps, type ReactNode } from "react"
import { IconEye, IconEyeOff } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** 로그인·가입·재설정 화면 위쪽: 앱 아이콘, 제목, 한 줄 설명 */
export function AuthHeader({
  title,
  desc,
}: {
  title: string
  desc?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 pt-2 pb-1 text-center">
      <img
        src="/icons/icon-192.png"
        alt=""
        draggable={false}
        className="size-12 rounded-[15px] shadow-[0_4px_12px_rgb(10_99_201/.26)]"
      />
      <h1 className="mt-0.5 text-base font-semibold tracking-tight">{title}</h1>
      {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
    </div>
  )
}

type FieldProps = ComponentProps<"input"> & {
  label: string
  icon: ReactNode
  error?: string
}

/** 아이콘이 붙은 입력칸. 비밀번호면 보기/숨기기 버튼이 붙는다 */
export function Field({
  label,
  icon,
  error,
  type,
  className,
  ...props
}: FieldProps) {
  const [show, setShow] = useState(false)
  const password = type === "password"
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground [&_svg]:size-4">
          {icon}
        </span>
        <Input
          aria-label={label}
          placeholder={label}
          type={password && show ? "text" : type}
          aria-invalid={!!error}
          className={cn("h-9 pl-9 text-sm", password && "pr-9", className)}
          {...props}
        />
        {password && (
          <button
            type="button"
            aria-label={show ? "비밀번호 숨기기" : "비밀번호 보기"}
            onClick={() => setShow(!show)}
            className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40 [&_svg]:size-4"
          >
            {show ? <IconEyeOff /> : <IconEye />}
          </button>
        )}
      </div>
      {error && <p className="pl-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

/** 서버 오류 등 폼 전체에 대한 안내 */
export const FormError = ({ children }: { children?: ReactNode }) =>
  children ? (
    <p
      role="alert"
      className="rounded-md bg-destructive/8 px-3 py-2 text-xs text-destructive"
    >
      {children}
    </p>
  ) : null

export const bigButton = "h-9 w-full text-[13px] font-semibold"

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      또는
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" aria-hidden className="size-4">
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
    />
  </svg>
)

const KakaoLogo = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="size-4">
    <path
      fill="#000"
      d="M12 3C6.48 3 2 6.5 2 10.82c0 2.8 1.86 5.25 4.66 6.63l-.95 3.48c-.08.3.26.54.52.37l4.15-2.74c.53.06 1.07.1 1.62.1 5.52 0 10-3.5 10-7.84S17.52 3 12 3z"
    />
  </svg>
)

type SocialProps = {
  provider: "google" | "kakao"
  busy: boolean
  disabled: boolean
  onClick: () => void
}

/** 브랜드 안내에 맞춘 소셜 로그인 버튼(구글 흰색, 카카오 노란색) */
export function SocialButton({
  provider,
  busy,
  disabled,
  onClick,
}: SocialProps) {
  const google = provider === "google"
  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        bigButton,
        "gap-2 font-medium",
        !google &&
          "border-transparent bg-[#FEE500] text-black/85 hover:bg-[#F5DC00] dark:bg-[#FEE500] dark:text-black/85 dark:hover:bg-[#F5DC00]",
      )}
    >
      {busy ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : google ? (
        <GoogleLogo />
      ) : (
        <KakaoLogo />
      )}
      {google ? "Google로 계속하기" : "카카오로 계속하기"}
    </Button>
  )
}

export const BackLink = ({ onBack }: { onBack: () => void }) => (
  <button
    type="button"
    onClick={onBack}
    className="self-center text-xs text-muted-foreground hover:text-foreground hover:underline"
  >
    로그인으로 돌아가기
  </button>
)
