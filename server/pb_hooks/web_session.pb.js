/// <reference path="../pb_data/types.d.ts" />

// 웹(PWA)은 토큰을 HttpOnly 쿠키로만 주고받는다(스크립트가 읽을 수 없게). 데스크톱 앱은 기존대로 Authorization 헤더.
// 웹 클라이언트는 모든 요청에 X-Session: cookie 를 붙인다. 쿠키는 SameSite=Strict라 다른 사이트에서 온 요청엔 실리지 않는다.

// 쿠키의 토큰을 Authorization으로 옮긴다. PocketBase의 토큰 읽기 미들웨어(-1020)보다 먼저 돈다
routerUse(
  new Middleware((e) => {
    const h = e.requestInfo().headers
    if (h["x_session"] === "cookie" && !h["authorization"]) {
      try {
        const c = e.request.cookie("pb_auth")
        if (c && c.value) e.request.header.set("Authorization", c.value)
      } catch (_) {
        // 쿠키 없음
      }
    }
    return e.next()
  }, -1100, "webSessionCookie"),
)

// 로그인·갱신 응답: 토큰은 쿠키에만 넣고 본문에서는 뺀다
onRecordAuthRequest((e) => {
  if (e.requestInfo().headers["x_session"] !== "cookie") return e.next()
  const maxAge = e.record.collection().authToken.duration
  e.setCookie(new Cookie({ name: "pb_auth", value: e.token, path: "/", maxAge, secure: true, httpOnly: true, sameSite: 3 }))
  // 비밀이 아닌 표시용 쿠키: 새로 고침 때 앱이 세션이 있는지 알 수 있게
  e.setCookie(new Cookie({ name: "pb_session", value: "1", path: "/", maxAge, secure: true, sameSite: 3 }))
  e.token = ""
  return e.next()
}, "users")

routerAdd("POST", "/api/web/logout", (e) => {
  for (const name of ["pb_auth", "pb_session"])
    e.setCookie(new Cookie({ name, value: "", path: "/", maxAge: -1, secure: true, sameSite: 3 }))
  return e.noContent(204)
})
