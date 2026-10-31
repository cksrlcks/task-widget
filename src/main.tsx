import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { SettingsWindow } from "@/features/settings/SettingsWindow"
import { getPrefs, initPrefs } from "@/features/settings/appPrefs"
import { isTauri } from "@/features/shell/platform"
import { initWindow } from "@/features/widget/windowPos"
import { ConfirmProvider } from "@/hooks/use-confirm"
import { initPb } from "@/lib/pb"
import App from "./App"
import "./index.css"

const queryClient = new QueryClient()
const isSettings = location.hash === "#settings"

// 설정 창은 테마만 따른다. 배율·창 속성은 위젯 창이 storage 이벤트로 적용한다
if (isSettings) initPrefs({ windowEffects: false })
else if (!isTauri()) initPrefs()
else {
  // 투명 창: body는 비우고 App이 둥근 배경을 그린다
  document.body.classList.add("bg-transparent")
  // 위치를 잡고 띄운 뒤 창 속성(너비·항상 위)을 적용해야 오른쪽 끝 기준 계산이 맞는다
  void initWindow(getPrefs().width).catch(console.error).finally(initPrefs)
}

// 저장된 토큰을 읽은 뒤에 렌더한다
void initPb().then(() =>
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          {isSettings ? <SettingsWindow /> : <App />}
        </ConfirmProvider>
        <Toaster />
      </QueryClientProvider>
    </React.StrictMode>,
  ),
)
