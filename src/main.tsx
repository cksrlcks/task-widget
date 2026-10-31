import React from "react"
import ReactDOM from "react-dom/client"
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { Toaster } from "sonner"
import { isSessionLost } from "@/features/auth/authExpiry"
import { startAuthSession } from "@/features/auth/useAuth"
import { SettingsWindow } from "@/features/settings/SettingsWindow"
import { getPrefs, initPrefs } from "@/features/settings/appPrefs"
import { isTauri } from "@/features/shell/platform"
import { initWindow } from "@/features/widget/windowPos"
import { ConfirmProvider } from "@/hooks/use-confirm"
import { initPb, pb } from "@/lib/pb"
import App from "./App"
import "./index.css"

// 토큰이 만료·무효인 응답이면 토큰을 지워 로그인 화면으로 보낸다
const onError = (err: unknown) => {
  if (isSessionLost(err, pb.authStore.isValid)) pb.authStore.clear()
}
const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
})
const isSettings = location.hash === "#settings"

// 브라우저 우클릭 메뉴(뒤로 가기·새로 고침 등)는 앱에 어울리지 않는다. 입력칸은 복사·붙여넣기용으로 남긴다
if (!import.meta.env.DEV)
  document.addEventListener("contextmenu", (e) => {
    if (!(e.target instanceof HTMLElement && e.target.closest("input, textarea"))) e.preventDefault()
  })
const isWidget = !isSettings && isTauri()

async function start() {
  let failure: unknown = null
  try {
    await initPb() // 저장된 토큰
  } catch (err) {
    failure = err
  }
  // 설정 창은 테마만 따른다. 배율·창 속성은 위젯 창이 storage 이벤트로 적용한다
  if (isSettings) initPrefs({ windowEffects: false })
  else if (!isWidget) initPrefs()
  else {
    // 투명 창: body는 비우고 App이 둥근 배경을 그린다
    document.body.classList.add("bg-transparent")
    // 위치를 잡고 띄운 뒤 창 속성(항상 위)을 적용한다
    await initWindow(() => getPrefs().anchor).catch(console.error)
    initPrefs()
  }
  if (failure) throw failure

  // 사용자가 바뀌면(로그아웃 포함) 이전 사용자의 캐시를 버린다
  let uid = pb.authStore.record?.id ?? null
  pb.authStore.onChange(() => {
    const id = pb.authStore.record?.id ?? null
    if (id === uid) return
    uid = id
    queryClient.clear()
  })
  if (isWidget) startAuthSession()

  return isSettings ? <SettingsWindow /> : <App />
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement)
start()
  .catch((err: unknown) => {
    console.error(err)
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 rounded-lg border bg-background p-6 text-center text-sm">
        <p className="font-medium">앱을 시작하지 못했습니다.</p>
        <p className="text-muted-foreground">
          {err instanceof Error ? err.message : String(err)}
        </p>
      </div>
    )
  })
  .then((view) =>
    root.render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <ConfirmProvider>{view}</ConfirmProvider>
          <Toaster />
        </QueryClientProvider>
      </React.StrictMode>,
    ),
  )
