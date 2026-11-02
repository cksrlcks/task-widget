import { toast } from "sonner"

export const toastClipError = (err: unknown) =>
  toast.error(
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "클립보드를 처리하지 못했습니다.",
  )
