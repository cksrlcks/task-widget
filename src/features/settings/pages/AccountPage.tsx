import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { authErrorMessage } from "@/features/auth/authErrors"
import {
  canUnlink,
  cancelOAuth,
  isOAuthCancelled,
  linkProvider,
  listLinked,
  unlinkProvider,
  type Provider,
} from "@/features/auth/oauth"
import { useAuth } from "@/features/auth/useAuth"
import { pb } from "@/lib/pb"
import { Pill, Row, Section, btnDanger, btnOutline } from "../settingsUi"

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "google", label: "구글" },
  { id: "kakao", label: "카카오" },
]
const LINKED_KEY = ["linked"]

export function AccountPage() {
  const { user, logout } = useAuth()
  const qc = useQueryClient()
  const [linking, setLinking] = useState<Provider | null>(null)
  const linked = useQuery({ queryKey: LINKED_KEY, queryFn: () => listLinked() })
  const hasPassword = useQuery({
    queryKey: ["hasPassword", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await pb.collection("users").getOne(user!.id)).hasPassword === true,
  })
  const refresh = () => qc.invalidateQueries({ queryKey: LINKED_KEY })
  const ready = linked.isSuccess && hasPassword.isSuccess
  const list = linked.data ?? []
  const unlinkable = ready && canUnlink(list, hasPassword.data)

  async function link(p: Provider) {
    setLinking(p)
    try {
      await linkProvider(p)
    } catch (err) {
      if (!isOAuthCancelled(err)) toast.error(authErrorMessage(err, "link"))
    } finally {
      setLinking(null)
      void refresh()
    }
  }

  const unlink = useMutation({
    mutationFn: (p: Provider) => unlinkProvider(p),
    onSuccess: refresh,
    onError: (err) => toast.error(authErrorMessage(err, "link")),
  })

  const reset = useMutation({
    mutationFn: () => pb.collection("users").requestPasswordReset(user!.email),
    onSuccess: () => toast.success("메일을 보냈습니다"),
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "메일을 보내지 못했습니다",
      ),
  })

  async function signOut() {
    logout()
    const { getCurrentWindow } = await import("@tauri-apps/api/window")
    await getCurrentWindow().close()
  }

  return (
    <>
      <Section title="내 계정">
        <Row title="이메일" desc="로그인할 때 쓰는 이메일입니다">
          <Pill>{user?.email ?? "…"}</Pill>
        </Row>
      </Section>
      <Section title="소셜 로그인">
        {PROVIDERS.map(({ id, label }) => {
          const on = list.includes(id)
          return (
            <Row
              key={id}
              title={label}
              desc={
                on && ready && !unlinkable
                  ? "로그인 수단이 하나뿐이라 해제할 수 없습니다"
                  : undefined
              }
            >
              <span className="flex shrink-0 gap-2">
                {linking === id && (
                  <button
                    type="button"
                    onClick={() => cancelOAuth()}
                    className={btnOutline}
                  >
                    취소
                  </button>
                )}
                <button
                  type="button"
                  disabled={on || linking !== null || !linked.isSuccess}
                  onClick={() => void link(id)}
                  className={btnOutline}
                >
                  {on ? "연결됨" : linking === id ? "연결 중…" : "연결"}
                </button>
                {on && (
                  <button
                    type="button"
                    disabled={!unlinkable || unlink.isPending}
                    onClick={() => unlink.mutate(id)}
                    className={btnOutline}
                  >
                    해제
                  </button>
                )}
              </span>
            </Row>
          )
        })}
      </Section>
      <Section title="보안">
        <Row title="비밀번호" desc="메일로 받은 링크에서 설정합니다">
          <button
            type="button"
            disabled={!hasPassword.isSuccess || reset.isPending}
            onClick={() => reset.mutate()}
            className={btnOutline}
          >
            {hasPassword.data ? "비밀번호 변경" : "비밀번호 만들기"}
          </button>
        </Row>
        <Row
          title="로그아웃"
          desc="로그아웃하면 다시 들어올 때 로그인이 필요합니다"
        >
          <button
            type="button"
            onClick={() => void signOut()}
            className={btnDanger}
          >
            로그아웃
          </button>
        </Row>
      </Section>
    </>
  )
}
