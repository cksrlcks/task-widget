# 태스크 위젯 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 화면 오른쪽에 떠 있는 Windows 위젯(뽀모도로 · 투두 · 미니 캘린더)과, Dokploy에 올릴 PocketBase 백엔드를 만든다.

**Architecture:** 백엔드 코드는 짜지 않는다. PocketBase가 DB·인증·API를 맡고, 스키마와 접근 규칙은 `server/pb_migrations`의 마이그레이션 파일로 저장소에 남긴다. 클라이언트는 Tauri 2 + React로, pocketbase JS SDK가 서버에 직접 붙고, Rust는 창·트레이·플러그인만 맡는다. UI 기반(Tailwind 테마, shadcn 컴포넌트, 설정 화면 모양, prefs 저장 방식)은 U-Drive(`D:\project\cloude-drive`)에서 가져온다.

**Tech Stack:** Tauri 2, React 19, Vite, TypeScript, Tailwind v4, shadcn(base-ui), @tabler/icons-react, Pretendard, TanStack Query 5, pocketbase JS SDK, Vitest, PocketBase(Docker)

**Spec:** `docs/superpowers/specs/2026-10-31-task-widget-design.md`

## Global Constraints

- Windows 전용으로 만든다(macOS를 막지는 않는다).
- 토큰은 localStorage 금지. Tauri store 플러그인 파일에 저장한다. 단순 설정(prefs)은 localStorage 허용.
- 서버 주소는 빌드 시 환경변수 `VITE_PB_URL`로 고정한다. 사용자가 바꾸지 않는다.
- 모든 사용자 데이터 컬렉션의 규칙: `@request.auth.id != "" && user = @request.auth.id`. 생성 규칙은 여기에 `&& @request.body.user = @request.auth.id`를 더한다.
- 이메일 로그인은 이메일 인증을 거친 계정만 허용한다.
- OAuth 결과에 이메일이 없으면 계정을 만들지 않고 로그인을 막는다.
- 로그인 수단이 하나만 남으면 소셜 연결 해제를 막는다.
- 위젯은 다른 창 위에 떠 있는 일반 창이다. AppBar(작업 영역 차지)는 만들지 않는다.
- 실시간 동기화, 뽀모도로 기록 저장, 반복 일정, 오프라인 큐는 만들지 않는다.
- 설정 기본값: 테마 시스템, 화면 크기 100%, 위젯 너비 500, 항상 위 켬, 투명도 100%, 자동 실행 끔, 트레이 실행 켬, 세 섹션 모두 켬, 집중 25분, 짧은 휴식 5분, 긴 휴식 15분, 긴 휴식까지 4회, 알림음 켬.
- 화면 크기 옵션: 90 / 100 / 110 / 125%. 위젯 너비 옵션: 400 / 500 / 600px. 투명도 범위: 70~100%.
- 다음 뽀모도로 단계는 자동 시작하지 않는다.
- 에러 토스트: `toast.error(err instanceof Error ? err.message : "기본 메시지")`. 성공은 `toast.success`.
- 삭제 확인은 `useConfirm` 훅(글로벌 CLAUDE.md의 코드 그대로)을 쓴다. 브라우저 `confirm()` 금지.
- 모달 닫기는 하단 취소 버튼. 상단 X 아이콘 금지.
- 컴포넌트 props는 `type`으로 선언하고 재사용 컴포넌트는 `className` prop을 받는다.
- queryKey는 팩토리 패턴(`todoKeys.all`, `eventKeys.month(ym)`).
- 폼은 zod 스키마를 먼저 정의하고 react-hook-form, 서버 에러는 `setError("root", …)`.

## Review Focus

1. **앱 시작 시 저장된 토큰이 만료됐거나 서버에 닿지 않음** → 빈 화면이 아니라 로그인 화면(만료) 또는 "서버에 연결할 수 없습니다 · 다시 시도"(네트워크)가 보여야 한다. Task 5에 `bootAuth` 테스트.
2. **저장된 창 위치가 지금 연결된 모니터 밖** (노트북을 외부 모니터에서 뺀 경우) → 주 모니터 오른쪽 끝 기본 위치로 되돌린다. Task 9에 `clampToMonitors` 테스트.
3. **창이 숨겨졌거나 PC가 절전에서 깨어남** → 타이머가 멈췄다 이어가는 게 아니라 실제 지난 시간만큼 줄어 있어야 한다. 남은 시간은 종료 시각 기준으로 계산한다. Task 4에 `remaining` 테스트.
4. **한국 시간 자정 근처에 만든 일정** → 고른 날짜 그대로 보여야 한다. 날짜를 문자열 `YYYY-MM-DD`로 저장한다. Task 8에 `toYmd` 테스트.
5. **실행 중에 뽀모도로 시간 설정을 바꿈** → 지금 단계는 그대로 가고 다음 단계부터 새 값이 적용된다. Task 4에 테스트.

---

## 파일 구조

```
task-manager/
├── package.json, vite.config.ts, vitest.config.ts, tsconfig*.json, components.json, index.html
├── .env.example                      # VITE_PB_URL=
├── server/
│   ├── Dockerfile
│   ├── pb_migrations/1730300000_init.js
│   ├── pb_hooks/password.pb.js
│   └── test/rules.test.mjs           # 로컬 PocketBase에 대고 규칙 검증
├── src/
│   ├── main.tsx, App.tsx, index.css
│   ├── components/ui/                # U-Drive에서 복사: button, checkbox, dialog, input, tooltip
│   ├── hooks/use-confirm.tsx
│   ├── lib/utils.ts, lib/pb.ts       # pb 클라이언트(단일 인스턴스)
│   └── features/
│       ├── shell/platform.ts         # U-Drive에서 복사
│       ├── settings/appPrefs.ts, SettingsWindow.tsx, pages/*.tsx
│       ├── auth/authStore.ts, bootAuth.ts, authErrors.ts, oauth.ts, LoginScreen.tsx, SignupForm.tsx
│       ├── pomodoro/pomodoro.ts, usePomodoro.ts, PomodoroSection.tsx
│       ├── todos/type.ts, queries.ts, sortTodos.ts, TodoSection.tsx
│       ├── calendar/type.ts, queries.ts, monthGrid.ts, CalendarSection.tsx, DayPanel.tsx
│       └── widget/Widget.tsx, TopBar.tsx, windowPos.ts
└── src-tauri/
    ├── tauri.conf.json, Cargo.toml, capabilities/default.json
    └── src/lib.rs, src/main.rs
```

---

### Task 1: 프로젝트 뼈대

**Files:**
- Create: 위 구조의 루트 설정 파일 전부, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/components/ui/*`, `src/lib/utils.ts`, `src/features/shell/platform.ts`, `src/hooks/use-confirm.tsx`, `src-tauri/*`, `.gitignore`
- Test: `src/lib/utils.test.ts`

**Interfaces:**
- Produces: `cn(...classes)`, `isTauri()`, `openExternal(url)`, `ConfirmProvider`, `useConfirm()`, 경로 별칭 `@/` → `src/`

- [ ] **Step 1:** `git init`, `.gitignore`에 `node_modules`, `dist`, `src-tauri/target`, `.superpowers/`, `.env`, `server/pb_data` 추가.
- [ ] **Step 2:** `npm create tauri-app@latest`(React + TS 템플릿, identifier `com.chang.taskwidget`, productName `Task Widget`)로 생성하거나 수동 구성. `vite.config.ts`, `vitest.config.ts`, `components.json`, `tsconfig*.json`은 U-Drive 파일을 그대로 복사.
- [ ] **Step 3:** U-Drive의 `src/index.css`(테마 토큰, 다크 variant, Pretendard), `src/components/ui/{button,checkbox,dialog,input,tooltip}.tsx`, `src/lib/utils.ts`, `src/features/shell/platform.ts`를 복사. 의존성은 U-Drive `package.json`에서 필요한 것만: react, react-dom, @base-ui/react, @tabler/icons-react, tailwindcss, @tailwindcss/vite, tw-animate-css, shadcn, pretendard, class-variance-authority, cn, @tanstack/react-query, @tauri-apps/api, @tauri-apps/plugin-opener, @tauri-apps/plugin-autostart. 추가: pocketbase, sonner, zod, react-hook-form, @hookform/resolvers, @tauri-apps/plugin-store, @tauri-apps/plugin-notification, @tauri-apps/plugin-updater, @tauri-apps/plugin-process. alert-dialog가 U-Drive에 없으면 `npx shadcn add alert-dialog`.
- [ ] **Step 4:** `src/hooks/use-confirm.tsx`를 글로벌 CLAUDE.md 코드 그대로 작성. `main.tsx`에서 `QueryClientProvider` → `ConfirmProvider` → `App` + `<Toaster />`.
- [ ] **Step 5:** 테스트 작성.

```ts
// src/lib/utils.test.ts
import { cn } from "./utils"
test("cn merges tailwind classes", () => {
  expect(cn("px-2", "px-4")).toBe("px-4")
})
```

- [ ] **Step 6:** `npm test` → PASS. `npm run tauri dev` → 빈 창이 뜬다.
- [ ] **Step 7:** Commit `chore: scaffold tauri + react project from u-drive base`.

---

### Task 2: PocketBase 서버 (스키마 · 규칙 · Docker)

**Files:**
- Create: `server/Dockerfile`, `server/pb_migrations/1730300000_init.js`, `server/pb_hooks/password.pb.js`, `server/test/rules.test.mjs`, `server/README.md`

**Interfaces:**
- Produces: 컬렉션 `todos { user, title, done, created, updated }`, `events { user, title, date("YYYY-MM-DD"), time("HH:mm"|""), memo }`. users 컬렉션 설정: 비밀번호 로그인 켬, OAuth2 google·kakao 켬, 인증 안 된 이메일 로그인 차단.

- [ ] **Step 1:** `Dockerfile`: 최신 안정 PocketBase 리눅스 바이너리를 받아 `/pb`에 두고 `COPY pb_migrations /pb/pb_migrations`, `CMD ["/pb/pocketbase","serve","--http=0.0.0.0:8090"]`, `VOLUME /pb/pb_data`.
- [ ] **Step 2:** 마이그레이션 작성. todos: `title` text required max 500, `done` bool, `user` relation(users, cascadeDelete true) required, autodate created/updated. events: `title` text required max 200, `date` text required pattern `^\d{4}-\d{2}-\d{2}$`, `time` text pattern `^$|^\d{2}:\d{2}$`, `memo` text max 2000, `user` relation. 두 컬렉션 list/view/update/delete 규칙은 Global Constraints의 규칙, create는 body 조건 추가. users: `passwordAuth.enabled = true`, `oauth2.enabled = true`, `authRule = "verified = true"`(인증 안 된 이메일 로그인 차단; OAuth로 만든 계정은 PocketBase가 verified로 만든다 — Step 4에서 확인), `deleteRule = "id = @request.auth.id"`, bool 필드 `hasPassword` 추가(Task 6의 연결 해제 판단용. 이메일 가입 시 클라이언트가 true로 생성). `server/pb_hooks/password.pb.js`에서 비밀번호 재설정 확인 시(`onRecordConfirmPasswordResetRequest`) `hasPassword = true`로 저장. Dockerfile에 `COPY pb_hooks /pb/pb_hooks`.
- [ ] **Step 3:** 규칙 테스트 작성(node:test + pocketbase SDK, 로컬 `http://127.0.0.1:8090`, 관리자 계정은 환경변수).

```js
test("user B cannot list user A's todos", async () => {
  // admin으로 verified 사용자 A, B 생성 → A로 todo 생성 → B로 getFullList
  assert.equal(listAsB.length, 0)
})
test("user B cannot create todo with user=A", async () => {
  await assert.rejects(pbB.collection("todos").create({ title: "x", user: A.id }))
})
test("unverified user cannot log in with password", async () => {
  await assert.rejects(pb.collection("users").authWithPassword(unverifiedEmail, pw))
})
test("password reset confirm sets hasPassword", async () => {
  // admin으로 hasPassword=false 사용자 생성 → requestPasswordReset → 관리자 API로 토큰 받아 confirmPasswordReset
  assert.equal(after.hasPassword, true)
})
test("events.date rejects non YYYY-MM-DD", async () => {
  await assert.rejects(pbA.collection("events").create({ title: "x", date: "2026-1-1", user: A.id }))
})
```

- [ ] **Step 4:** 로컬에서 `docker build -t task-pb server && docker run -p 8090:8090 task-pb` 후 `node --test server/test/` → 5개 PASS.
- [ ] **Step 5:** **로그인된 상태에서 `authWithOAuth2`가 현재 계정에 외부 계정을 연결하는지** 사용 중인 PocketBase 버전 문서(또는 소스 `apis/record_auth_with_oauth2.go`)에서 확인하고 결과를 `server/README.md`에 적는다. 연결이 안 되는 버전이면 작업을 멈추고 보고한다(Task 6 설계가 바뀜).
- [ ] **Step 6:** `server/README.md`에 Dokploy 배포 절차: Dockerfile 앱 생성, 볼륨 `/pb/pb_data`, 도메인+HTTPS, 첫 실행 후 관리자 계정 생성, SMTP 설정, 구글·카카오 OAuth 클라이언트 ID/시크릿 입력, 리다이렉트 `https://<도메인>/api/oauth2-redirect`, 카카오 이메일 동의항목 켜기.
- [ ] **Step 7:** Commit `feat(server): pocketbase schema, rules and dockerfile`.

---

### Task 3: 설정 저장소 (appPrefs)

**Files:**
- Create: `src/features/settings/appPrefs.ts`
- Test: `src/features/settings/appPrefs.test.ts`

**Interfaces:**
- Produces:
```ts
type Theme = "system" | "light" | "dark"
type AppPrefs = {
  theme: Theme; zoom: 0.9 | 1 | 1.1 | 1.25; width: 400 | 500 | 600
  alwaysOnTop: boolean; opacity: number /* 0.7~1 */; closeToTray: boolean
  showPomodoro: boolean; showTodos: boolean; showCalendar: boolean
  focusMin: number; shortBreakMin: number; longBreakMin: number; longBreakEvery: number; sound: boolean
}
const DEFAULTS: AppPrefs
function loadPrefs(raw: string | null): AppPrefs
function getPrefs(): AppPrefs
function setPrefs(patch: Partial<AppPrefs>): void
function useAppPrefs(): AppPrefs
function initPrefs(): void
```
(자동 실행은 prefs가 아니라 autostart 플러그인 상태를 직접 읽는다 — U-Drive와 같음.)

- [ ] **Step 1:** 테스트 작성.

```ts
test("defaults match spec", () => {
  expect(loadPrefs(null)).toEqual({ theme: "system", zoom: 1, width: 500, alwaysOnTop: true, opacity: 1, closeToTray: true,
    showPomodoro: true, showTodos: true, showCalendar: true, focusMin: 25, shortBreakMin: 5, longBreakMin: 15, longBreakEvery: 4, sound: true })
})
test("partial saved prefs merge over defaults", () => {
  expect(loadPrefs('{"width":600}').width).toBe(600)
  expect(loadPrefs('{"width":600}').focusMin).toBe(25)
})
test("broken json falls back to defaults", () => {
  expect(loadPrefs("{oops")).toEqual(DEFAULTS)
})
test("out-of-range values are clamped", () => {
  expect(loadPrefs('{"opacity":0.1}').opacity).toBe(0.7)
  expect(loadPrefs('{"focusMin":0}').focusMin).toBe(1)
})
```

- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** U-Drive `appPrefs.ts` 구조(localStorage 키 `taskwidget.prefs`, listeners, `useSyncExternalStore`, storage 이벤트로 창 간 동기화)를 따라 구현. `apply()`는 테마 class 토글 + `setZoom` + `invoke("apply_window_prefs", { alwaysOnTop, opacity, width, closeToTray })`(Task 9에서 정의). 분 값은 1~120, 횟수는 1~10으로 clamp.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: app prefs store with spec defaults`.

---

### Task 4: 뽀모도로 로직 + 섹션

**Files:**
- Create: `src/features/pomodoro/pomodoro.ts`, `usePomodoro.ts`, `PomodoroSection.tsx`
- Test: `src/features/pomodoro/pomodoro.test.ts`

**Interfaces:**
- Consumes: `useAppPrefs()` (focusMin, shortBreakMin, longBreakMin, longBreakEvery, sound)
- Produces:
```ts
type Phase = "focus" | "short" | "long"
type PomoState = { phase: Phase; round: number /* 1부터, 현재 집중 회차 */; status: "idle" | "running" | "paused" | "done";
  endsAt: number | null; pausedLeftMs: number | null; durationMs: number }
type Durations = { focusMin: number; shortBreakMin: number; longBreakMin: number; longBreakEvery: number }
function initial(d: Durations): PomoState
function start(s: PomoState, now: number): PomoState
function pause(s: PomoState, now: number): PomoState
function reset(s: PomoState, d: Durations): PomoState       // 현재 단계를 처음부터
function tick(s: PomoState, now: number): PomoState          // 시간이 다 되면 status "done"
function next(s: PomoState, d: Durations): PomoState         // 다음 단계로, status "idle"
function remaining(s: PomoState, now: number): number        // ms
```
`skip`은 `next`를 그대로 쓴다.

- [ ] **Step 1:** 테스트 작성.

```ts
const d = { focusMin: 25, shortBreakMin: 5, longBreakMin: 15, longBreakEvery: 4 }
test("remaining is based on wall clock, not ticks", () => {
  const s = start(initial(d), 0)
  expect(remaining(s, 10 * 60_000)).toBe(15 * 60_000)   // 10분 동안 tick이 없어도
})
test("pause freezes remaining, start resumes", () => {
  let s = pause(start(initial(d), 0), 60_000)
  expect(remaining(s, 999_999)).toBe(24 * 60_000)
  s = start(s, 1_000_000)
  expect(remaining(s, 1_060_000)).toBe(23 * 60_000)
})
test("tick past end marks done and does not auto start next", () => {
  const s = tick(start(initial(d), 0), 25 * 60_000 + 1)
  expect(s.status).toBe("done"); expect(s.phase).toBe("focus")
})
test("focus -> short, and 4th focus -> long", () => {
  let s = initial(d)
  s = next(s, d); expect(s.phase).toBe("short")
  s = next(s, d); expect(s.phase).toBe("focus"); expect(s.round).toBe(2)
  s = next(next(next(next(s, d), d), d), d)            // round 4 focus
  expect(s.round).toBe(4); s = next(s, d); expect(s.phase).toBe("long")
  s = next(s, d); expect(s.round).toBe(1)
})
test("changed durations apply from next phase only", () => {
  const s = start(initial(d), 0)
  const d2 = { ...d, focusMin: 50, shortBreakMin: 10 }
  expect(remaining(s, 0)).toBe(25 * 60_000)
  expect(next(s, d2).durationMs).toBe(10 * 60_000)
})
```

- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** 순수 함수로 구현. `remaining = status==="running" ? max(0, endsAt-now) : pausedLeftMs ?? durationMs`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** `usePomodoro()` 훅: 상태는 `useState`, 500ms `setInterval`로 `tick`, `"done"`으로 바뀌는 순간 `@tauri-apps/plugin-notification`으로 알림("집중 끝! 휴식할 시간이에요" / "휴식 끝! 다시 집중할 시간이에요") + `sound`가 켜져 있으면 짧은 효과음(`public/ding.mp3`). 알림 권한이 없으면 처음 한 번 요청.
- [ ] **Step 6:** `PomodoroSection`: 단계 라벨("집중 2/4" · "짧은 휴식" · "긴 휴식"), `mm:ss` 큰 글자, 시작/일시정지 · 리셋 · 건너뛰기 버튼(tabler 아이콘 + aria-label).
- [ ] **Step 7:** Commit `feat: pomodoro state machine and section`.

---

### Task 5: 인증 기반 (pb 클라이언트 · 토큰 저장 · 이메일 로그인/가입)

**Files:**
- Create: `src/lib/pb.ts`, `src/features/auth/authStore.ts`, `bootAuth.ts`, `authErrors.ts`, `LoginScreen.tsx`, `SignupForm.tsx`, `ResetForm.tsx`, `useAuth.ts`
- Test: `src/features/auth/bootAuth.test.ts`, `authErrors.test.ts`

**Interfaces:**
- Produces:
```ts
// lib/pb.ts
const pb: PocketBase   // new PocketBase(import.meta.env.VITE_PB_URL, authStore)
// authStore.ts
function createAuthStore(): Promise<AsyncAuthStore>   // Tauri store "auth.json" 키 "pb_auth"
// bootAuth.ts
type BootResult = "authed" | "login" | "offline"
function bootAuth(client: Pick<PocketBase, "authStore" | "collection">): Promise<BootResult>
// authErrors.ts
function authErrorMessage(err: unknown, ctx: "login" | "signup" | "oauth" | "link"): string
// useAuth.ts
function useAuth(): { user: RecordModel | null; status: BootResult | "loading"; logout(): void }
```

- [ ] **Step 1:** 테스트 작성.

```ts
test("no saved token -> login", async () => {
  expect(await bootAuth(fake({ token: "" }))).toBe("login")
})
test("refresh ok -> authed", async () => {
  expect(await bootAuth(fake({ token: "t", refresh: "ok" }))).toBe("authed")
})
test("refresh 401 -> clears token and login", async () => {
  const c = fake({ token: "t", refresh: { status: 401 } })
  expect(await bootAuth(c)).toBe("login"); expect(c.authStore.clear).toHaveBeenCalled()
})
test("network error (status 0) -> offline, token kept", async () => {
  const c = fake({ token: "t", refresh: { status: 0 } })
  expect(await bootAuth(c)).toBe("offline"); expect(c.authStore.clear).not.toHaveBeenCalled()
})
test("signup duplicate email message", () => {
  expect(authErrorMessage(pbErr(400, { email: { code: "validation_not_unique" } }), "signup"))
    .toBe("이미 가입된 이메일입니다. 구글/카카오로 로그인하거나 비밀번호 찾기로 비밀번호를 만드세요.")
})
test("login unverified message", () => {
  expect(authErrorMessage(pbErr(400, {}), "login")).toBe("이메일 또는 비밀번호가 맞지 않거나, 아직 이메일 인증을 하지 않았습니다.")
})
test("network error message", () => {
  expect(authErrorMessage(pbErr(0, {}), "login")).toBe("서버에 연결할 수 없습니다.")
})
```

- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** `bootAuth`: 토큰 없으면 "login"; `collection("users").authRefresh()` 성공 "authed"; ClientResponseError status 401/403/404면 `authStore.clear()` 후 "login"; status 0이면 "offline". `authErrorMessage`는 위 문구 그대로 + 기본 "요청을 처리하지 못했습니다."
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** `authStore.ts`: `@tauri-apps/plugin-store`의 `load("auth.json")`에서 초기값을 읽어 `new AsyncAuthStore({ save: v => store.set("pb_auth", v).then(() => store.save()), initial, clear: () => store.delete("pb_auth").then(() => store.save()) })`. `main.tsx`에서 store 준비 후 렌더.
- [ ] **Step 6:** UI. `App`이 `useAuth().status`로 분기: loading(스피너) / login(`LoginScreen`) / offline("서버에 연결할 수 없습니다" + 다시 시도) / authed(`Widget`). `LoginScreen`: 이메일·비밀번호(zod: email, min 8) + 로그인, 구글/카카오 버튼(Task 6에서 연결), "회원가입", "비밀번호 찾기" 링크. `SignupForm`: 이메일, 비밀번호, 비밀번호 확인 → `users.create` + `requestVerification` → "인증 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요." `ResetForm`: `requestPasswordReset`. 서버 에러는 `setError("root", { message: authErrorMessage(err, ctx) })`.
- [ ] **Step 7:** 로컬 PocketBase(Task 2)로 수동 확인: 가입 → 인증 전 로그인 거부 → 관리자 UI에서 verified 켬 → 로그인 → 앱 재시작해도 로그인 유지 → 로그아웃.
- [ ] **Step 8:** Commit `feat: auth store, boot flow and email auth screens`.

---

### Task 6: 구글 · 카카오 로그인과 계정 연결

**Files:**
- Create: `src/features/auth/oauth.ts`
- Modify: `src/features/auth/LoginScreen.tsx`
- Test: `src/features/auth/oauth.test.ts`

**Interfaces:**
- Consumes: `pb`, `authErrorMessage`
- Produces:
```ts
type Provider = "google" | "kakao"
function signInWithProvider(provider: Provider): Promise<void>   // 로그인 안 된 상태
function linkProvider(provider: Provider): Promise<void>         // 로그인된 상태, 현재 계정에 연결
function listLinked(): Promise<Provider[]>                       // pb.collection("users").listExternalAuths(userId)
function unlinkProvider(provider: Provider): Promise<void>
function canUnlink(linked: Provider[], hasPassword: boolean): boolean
function assertEmail(meta: { email?: string } | undefined): void  // 없으면 throw Error(이메일 동의 안내)
```

- [ ] **Step 1:** 테스트 작성.

```ts
test("cannot unlink the only login method", () => {
  expect(canUnlink(["kakao"], false)).toBe(false)
  expect(canUnlink(["kakao", "google"], false)).toBe(true)
  expect(canUnlink(["kakao"], true)).toBe(true)
})
test("oauth without email is rejected", () => {
  expect(() => assertEmail({})).toThrow("카카오(또는 구글)에서 이메일 제공에 동의해 주세요.")
})
```

- [ ] **Step 2:** `npm test` → FAIL. Step 3 구현 후 → PASS.
- [ ] **Step 3:** `signInWithProvider`: `pb.collection("users").authWithOAuth2({ provider, urlCallback: openUrl })`(`@tauri-apps/plugin-opener`). 결과 `meta.email`이 없으면 `pb.authStore.clear()` 후 `assertEmail`로 throw. 이때 이미 만들어진 레코드가 있고 다른 로그인 수단이 없으면 지운다(`meta.isNew === true`일 때만 삭제 — 본인 레코드 삭제는 규칙상 허용되도록 users deleteRule을 `id = @request.auth.id`로 둔다; Task 2 마이그레이션에 포함).
- [ ] **Step 4:** `linkProvider`: 로그인된 상태에서 같은 `authWithOAuth2` 호출(Task 2 Step 5에서 확인한 연결 동작에 의존). 응답 레코드 id가 현재 사용자와 다르면(이미 다른 계정에 연결된 소셜) 원래 토큰을 복구하고 `Error("이미 다른 계정에 연결돼 있습니다.")`. 그러려면 호출 전 `pb.authStore.token`과 `record`를 보관.
- [ ] **Step 5:** `unlinkProvider`: `pb.collection("users").unlinkExternalAuth(userId, provider)`. 호출 전 `canUnlink` 검사. `hasPassword`는 users 레코드의 `hasPassword` 필드(Task 2)를 쓴다.
- [ ] **Step 6:** LoginScreen의 구글/카카오 버튼 연결. 로컬 PocketBase + 실제 구글 테스트 클라이언트로 수동 확인: (a) 구글 새 로그인 (b) 같은 이메일 이메일계정 존재 시 통합 (c) 이메일 계정에 다른 이메일의 구글 연결 후 구글로 로그인 → 같은 계정.
- [ ] **Step 7:** Commit `feat: google/kakao oauth sign-in and account linking`.

---

### Task 7: 투두

**Files:**
- Create: `src/features/todos/type.ts`, `queries.ts`, `sortTodos.ts`, `TodoSection.tsx`
- Test: `src/features/todos/sortTodos.test.ts`

**Interfaces:**
- Produces:
```ts
type Todo = { id: string; title: string; done: boolean; created: string; updated: string }
const todoKeys = { all: ["todos"] as const }
function useTodos(): UseQueryResult<Todo[]>
function useAddTodo(), useUpdateTodo(), useDeleteTodo(), useClearDone()   // useMutation, onSuccess invalidate todoKeys.all
function sortTodos(list: Todo[]): Todo[]
```

- [ ] **Step 1:** 테스트.

```ts
test("undone first by created asc, done after by updated desc", () => {
  const out = sortTodos([t("a", true, "1", "5"), t("b", false, "2"), t("c", false, "1"), t("d", true, "1", "9")])
  expect(out.map(x => x.id)).toEqual(["c", "b", "d", "a"])
})
```

- [ ] **Step 2:** FAIL → Step 3 구현 → PASS.
- [ ] **Step 3:** 쿼리는 `pb.collection("todos").getFullList<Todo>()`. 생성 시 `user: pb.authStore.record.id`. 제목 zod: trim, 1~500자.
- [ ] **Step 4:** `TodoSection`: 목록(체크박스, 제목, 더블클릭 인라인 수정, hover 시 삭제 아이콘), 완료 항목 흐리게+취소선, 하단 "+ 할 일 추가" 입력(Enter로 추가), "완료 항목 지우기"(useConfirm 확인). 실패 시 toast.error. 빈 목록 문구 "할 일이 없어요".
- [ ] **Step 5:** Commit `feat: todo section`.

---

### Task 8: 미니 캘린더

**Files:**
- Create: `src/features/calendar/type.ts`, `queries.ts`, `monthGrid.ts`, `CalendarSection.tsx`, `DayPanel.tsx`
- Test: `src/features/calendar/monthGrid.test.ts`

**Interfaces:**
- Produces:
```ts
type CalEvent = { id: string; title: string; date: string; time: string; memo: string }
const eventKeys = { all: ["events"] as const, month: (ym: string) => ["events", ym] as const }
function useMonthEvents(ym: string): UseQueryResult<CalEvent[]>   // filter: date ~ "2026-10-%"
function useAddEvent(), useUpdateEvent(), useDeleteEvent()          // invalidate eventKeys.all
function toYmd(d: Date): string            // 로컬 시간 기준
function monthGrid(year: number, month: number /* 1~12 */): { ymd: string; inMonth: boolean }[]  // 일요일 시작, 6주 = 42칸
```

- [ ] **Step 1:** 테스트.

```ts
test("toYmd uses local date near midnight", () => {
  expect(toYmd(new Date(2026, 9, 31, 23, 59))).toBe("2026-10-31")
  expect(toYmd(new Date(2026, 10, 1, 0, 1))).toBe("2026-11-01")
})
test("october 2026 grid starts on sunday 9/27 and has 42 cells", () => {
  const g = monthGrid(2026, 10)
  expect(g.length).toBe(42); expect(g[0]).toEqual({ ymd: "2026-09-27", inMonth: false })
  expect(g[4]).toEqual({ ymd: "2026-10-01", inMonth: true })   // 2026-10-01은 목요일
  expect(g[41]).toEqual({ ymd: "2026-11-07", inMonth: false })
})
```

- [ ] **Step 2:** FAIL → Step 3 구현(라이브러리 없이 Date로) → PASS.
- [ ] **Step 3:** `CalendarSection`: "2026년 10월" + 이전/다음, 요일 헤더, 42칸 그리드, 오늘 강조, 일정 있는 날 점. 날짜 클릭 → `DayPanel`이 섹션 아래로 펼쳐짐: 그날 일정 목록(시간순, 종일 먼저), 추가 폼(zod: title 1~200, time `^$|^\d{2}:\d{2}$`, memo ≤2000), 수정, 삭제(useConfirm).
- [ ] **Step 4:** Commit `feat: mini calendar with day events`.

---

### Task 9: 위젯 창 (Rust · 트레이 · 위치)

**Files:**
- Create: `src/features/widget/Widget.tsx`, `TopBar.tsx`, `windowPos.ts`
- Modify: `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, `src-tauri/capabilities/default.json`
- Test: `src/features/widget/windowPos.test.ts`

**Interfaces:**
- Consumes: `useAppPrefs()`, 섹션 컴포넌트 3개
- Produces:
```ts
type Rect = { x: number; y: number; width: number; height: number }
function defaultRect(work: Rect, width: number): Rect          // 작업 영역 오른쪽 끝, 높이 = 작업 영역 높이
function clampToMonitors(saved: Rect | null, monitors: Rect[], primaryWork: Rect, width: number): Rect
```
Rust command: `apply_window_prefs(always_on_top: bool, opacity: f64, width: u32, close_to_tray: bool)`, `open_settings()`.

- [ ] **Step 1:** 테스트.

```ts
const work = { x: 0, y: 0, width: 1920, height: 1040 }
test("default sits at right edge with full work-area height", () => {
  expect(defaultRect(work, 500)).toEqual({ x: 1420, y: 0, width: 500, height: 1040 })
})
test("saved rect on a disconnected monitor falls back to default", () => {
  expect(clampToMonitors({ x: 3000, y: 100, width: 500, height: 800 }, [work], work, 500)).toEqual(defaultRect(work, 500))
})
test("saved rect on a connected monitor is kept, width follows prefs", () => {
  expect(clampToMonitors({ x: 100, y: 50, width: 400, height: 700 }, [work], work, 500)).toEqual({ x: 100, y: 50, width: 500, height: 700 })
})
```

- [ ] **Step 2:** FAIL → 구현 → PASS. "연결된 모니터 안"은 저장된 rect의 상단 바(위 32px) 중심점이 어느 모니터 안에 있는지로 판단.
- [ ] **Step 3:** `tauri.conf.json`: 창 `label "widget"`, `decorations false`, `transparent true`, `skipTaskbar true`, `resizable true`, `minWidth 400`, `minHeight 300`, `visible false`(위치 잡은 뒤 show). updater 블록은 Task 11.
- [ ] **Step 4:** `lib.rs`: U-Drive `lib.rs`의 트레이·single-instance·close-to-tray 패턴을 따른다. 트레이 메뉴 "보이기/숨기기", "설정", "종료"; 좌클릭은 토글. 플러그인: opener, store, notification, autostart(`--autostart`), single-instance, updater, process. `apply_window_prefs`는 `set_always_on_top`, 너비 변경 시 오른쪽 끝 기준 유지(x += 기존폭 - 새폭), 투명도는 Windows에서 `SetLayeredWindowAttributes`(windows crate `Win32_UI_WindowsAndMessaging`) 또는 웹뷰 루트 opacity CSS — 둘 중 텍스트가 흐려지지 않는 쪽(구현자 판단, 결과를 커밋 메시지에 적음). `open_settings`는 label "settings" 창(880×732, decorations true, 이미 열려 있으면 focus)을 `index.html#settings`로 연다.
- [ ] **Step 5:** 창 위치 저장: `onMoved`/`onResized`를 500ms debounce해서 Tauri store `window.json`에 rect 저장. 시작 시 `availableMonitors()`·`primaryMonitor()`로 `clampToMonitors` → `setPosition/setSize` → `show()`.
- [ ] **Step 6:** `Widget`: `TopBar`(`data-tauri-drag-region`, 앱 이름, 설정 버튼 → `invoke("open_settings")`, 숨기기 버튼) + 켜진 섹션만 세로로. 투두가 `flex-1`, 나머지는 내용 높이. 세 섹션이 다 꺼지면 "설정에서 표시할 항목을 켜 주세요".
- [ ] **Step 7:** 수동 확인: 오른쪽 끝에 뜸, 드래그 이동 후 재시작 시 복원, 트레이 토글, X → 트레이로, 항상 위 토글 동작.
- [ ] **Step 8:** Commit `feat: widget window, tray and position restore`.

---

### Task 10: 설정 창

**Files:**
- Create: `src/features/settings/SettingsWindow.tsx`, `pages/GeneralPage.tsx`, `pages/SectionsPage.tsx`, `pages/PomodoroPage.tsx`, `pages/AccountPage.tsx`, `settingsUi.tsx`
- Modify: `src/main.tsx` (hash `#settings`면 `SettingsWindow` 렌더)

**Interfaces:**
- Consumes: `useAppPrefs`, `setPrefs`, `linkProvider`, `unlinkProvider`, `listLinked`, `canUnlink`, `useAuth`
- Produces: 없음(화면)

- [ ] **Step 1:** `settingsUi.tsx`: U-Drive `SettingsDialog.tsx`의 `Section`, `Row`, `Segmented`, `Pill`, 버튼 클래스(`btn`, `btnOutline`)를 그대로 옮긴다. 레이아웃은 U-Drive와 같은 왼쪽 탐색(200px) + 오른쪽 헤더 "설정 / 페이지명" + 목록. 단 대화상자가 아니라 창 전체이고, 상단 X는 없다(창 자체 닫기 버튼 사용).
- [ ] **Step 2:** 페이지 (항목과 기본값은 spec 5장 표 그대로):
  - 일반: 테마(Segmented), 화면 크기(Segmented), 위젯 너비(Segmented), 항상 위에 표시(Checkbox), 위젯 투명도(range 70~100, 10 단위), 컴퓨터 켜면 자동 실행(autostart 플러그인, U-Drive `GeneralPage`와 같은 처리), 창을 닫아도 트레이에서 실행(Checkbox).
  - 위젯 구성: 뽀모도로/투두/캘린더 표시 Checkbox 3개.
  - 뽀모도로: 집중·짧은 휴식·긴 휴식(분, number input 1~120), 긴 휴식까지 집중 횟수(1~10), 알림음(Checkbox).
  - 내 계정: 이메일 Pill, 구글·카카오 행마다 "연결됨"/"연결" 버튼과 "해제" 버튼(`canUnlink`가 false면 disabled + 설명 "로그인 수단이 하나뿐이라 해제할 수 없습니다"), 비밀번호 행("비밀번호 만들기"/"비밀번호 변경" → `requestPasswordReset` 후 toast.success("메일을 보냈습니다")), 로그아웃(위험 버튼).
- [ ] **Step 3:** 수동 확인: 설정에서 바꾼 값이 위젯 창에 바로 반영(storage 이벤트) — 테마, 너비, 섹션 on/off, 항상 위, 투명도, 뽀모도로 시간.
- [ ] **Step 4:** Commit `feat: settings window`.

---

### Task 11: 배포 (자동 업데이트 · 릴리스)

**Files:**
- Modify: `src-tauri/tauri.conf.json`, `src/App.tsx`
- Create: `.github/workflows/release.yml`, `docs/release.md`

- [ ] **Step 1:** `npx tauri signer generate`로 업데이트 서명 키 생성. 공개키를 `tauri.conf.json` `plugins.updater.pubkey`에, endpoint는 `https://github.com/<owner>/<repo>/releases/latest/download/latest.json`, `bundle.createUpdaterArtifacts true`, windows `installMode "passive"`. 비밀키는 저장소에 넣지 않고 GitHub Secrets `TAURI_SIGNING_PRIVATE_KEY`.
- [ ] **Step 2:** 앱 시작 30초 뒤 `check()` → 업데이트 있으면 toast("새 버전이 있습니다", action "업데이트" → `downloadAndInstall` → `relaunch`).
- [ ] **Step 3:** `release.yml`: 태그 `v*` 푸시 시 windows-latest에서 `tauri-apps/tauri-action`으로 빌드·릴리스, `VITE_PB_URL`은 Secrets에서.
- [ ] **Step 4:** `docs/release.md`: 버전 올리기 → 태그 → 릴리스 확인 절차, 코드 서명 없이 배포 시 SmartScreen "추가 정보 → 실행" 안내 문구, 구글 OAuth 동의 화면 프로덕션 게시 체크리스트(앱 이름, 개인정보처리방침 URL), 카카오 앱 이메일 동의항목.
- [ ] **Step 5:** 수동 확인: v0.1.0 릴리스 설치 → v0.1.1 릴리스 → 앱이 업데이트를 알리고 설치됨.
- [ ] **Step 6:** Commit `chore: auto update and release workflow`.

---

## 실행 순서

Task 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11. Task 2(서버)는 Task 1과 독립이라 먼저 해도 된다. Task 4·7·8은 Task 5 이후 서로 독립.
