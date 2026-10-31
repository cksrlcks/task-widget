import { toast } from "sonner"

export const toastError = (err: unknown) =>
  toast.error(
    err instanceof Error ? err.message : "할 일을 저장하지 못했습니다.",
  )
