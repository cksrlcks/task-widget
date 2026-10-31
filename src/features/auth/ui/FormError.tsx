import type { ReactNode } from "react"

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
