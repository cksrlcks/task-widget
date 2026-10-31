import { useState, type ComponentProps, type ReactNode } from "react"
import { IconEye, IconEyeOff } from "@tabler/icons-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
