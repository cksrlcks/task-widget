import { toast } from "sonner"
import { isTauri } from "@/features/shell/platform"

const fail = (err: unknown) =>
  toast.error(err instanceof Error ? err.message : "창을 다루지 못했습니다.")

/** 창 숨기기(트레이에서 다시 연다) */
export const hideWindow = () => {
  if (!isTauri()) return
  void import("@tauri-apps/api/window")
    .then(({ getCurrentWindow }) => getCurrentWindow().hide())
    .catch(fail)
}
