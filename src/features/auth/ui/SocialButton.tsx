import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GoogleLogo } from "./GoogleLogo"
import { KakaoLogo } from "./KakaoLogo"
import { bigButton } from "./styles"

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
