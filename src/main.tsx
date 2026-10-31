import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"
import { ConfirmProvider } from "@/hooks/use-confirm"
import { initPb } from "@/lib/pb"
import App from "./App"
import "./index.css"

const queryClient = new QueryClient()

// 저장된 토큰을 읽은 뒤에 렌더한다
void initPb().then(() =>
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
        <Toaster />
      </QueryClientProvider>
    </React.StrictMode>,
  ),
)
