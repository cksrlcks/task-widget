# PocketBase 서버

PocketBase **v0.40.6** (Dockerfile의 `PB_VERSION`과 로컬 테스트 바이너리 동일).
컬렉션: `todos`, `events`, `users`(+`hasPassword`). 규칙은 마이그레이션(`pb_migrations/1730300000_init.js`)에 있다.

## 로컬 실행 / 테스트 (Docker 없이)

`server/.bin/`에 Windows 바이너리를 두고(gitignore):

```
server/.bin/pocketbase.exe superuser upsert <email> <pw> --dir server/pb_data --migrationsDir server/pb_migrations --hooksDir server/pb_hooks
server/.bin/pocketbase.exe serve --dir server/pb_data --migrationsDir server/pb_migrations --hooksDir server/pb_hooks --http 127.0.0.1:8090
PB_ADMIN_EMAIL=<email> PB_ADMIN_PASSWORD=<pw> npm run test:server
```

Docker: `docker build -t task-pb server && docker run -p 8090:8090 task-pb`.

비밀번호 재설정 테스트는 메일을 받을 수 없어, 서버와 같은 방식으로 재설정 JWT를 직접 서명한다
(`pb_data/data.db`를 읽기 전용으로 열어 `tokenKey` + `passwordResetToken.secret` 사용; `PB_DATA_DIR`로 경로 변경 가능).

## 로그인 상태에서 `authWithOAuth2` = 현재 계정에 연결 (확인함)

`apis/record_auth_with_oauth2.go` (v0.40.6):

```go
var fallbackAuthRecord *core.Record
if e.Auth != nil && e.Auth.Collection().Id == collection.Id {
    fallbackAuthRecord = e.Auth
}
...
switch {
case err == nil && externalAuthRel != nil:          // 이 외부 계정이 이미 어딘가에 연결됨 -> 그 레코드
    authRecord, err = e.App.FindRecordById(form.collection, externalAuthRel.RecordRef())
case fallbackAuthRecord != nil && fallbackAuthRecord.Collection().Id == form.collection.Id:
    // fallback to the logged auth record (if any)
    authRecord = fallbackAuthRecord                  // 로그인 상태 -> 현재 계정 (이메일 달라도 됨)
case authUser.Email != "":
    authRecord, err = e.App.FindAuthRecordByEmail(...) // 로그인 안 한 경우에만 이메일 조회
}
```

즉 인증된 요청이면 이메일이 달라도 현재 레코드에 ExternalAuth가 생성된다.
주의: 그 외부 계정이 **이미 다른 사용자에 연결돼 있으면** 그 사용자로 로그인된다(첫 case가 우선). Task 6은 연결 전 이를 고려할 것.
OAuth로 새로 만들어진 계정은 `SetVerified(true)`로 verified 처리된다(같은 파일, ~326행) -> `authRule = "verified = true"`와 충돌 없음.

## Dokploy 배포

1. Dokploy에서 Application 생성 -> Git 저장소, Build Type `Dockerfile`, Build Path/Context `server`.
2. Volume(Mount): `/pb/pb_data` (영속). 포트 8090.
3. Domains: 도메인 연결 + HTTPS(Let's Encrypt), 컨테이너 포트 8090.
4. 첫 실행 후 `https://<도메인>/_/`에서 관리자(superuser) 계정 생성.
5. Settings > Mail settings: SMTP 설정(인증/재설정 메일 필수). Application URL을 `https://<도메인>`으로.
6. Collections > users > Options > OAuth2: Google, Kakao 켜고 클라이언트 ID/시크릿 입력.
7. 각 OAuth 클라이언트의 리다이렉트 URI: `https://<도메인>/api/oauth2-redirect`.
8. 카카오 개발자 콘솔 > 동의항목에서 카카오계정(이메일)을 켠다(이메일 없으면 앱이 로그인을 막음).

## 보안: 이메일 자동 연결

PocketBase v0.40.6 소스(`apis/record_auth_with_oauth2.go`, `tools/auth/google.go`, `tools/auth/kakao.go`)를 확인했다.

- **자동 연결한다.** 기존 OAuth 연결도, 로그인 상태도 없으면 제공자가 준 이메일로 기존 계정을 찾아 그 계정에 연결한다.
  - `case authUser.Email != "":` → `e.App.FindAuthRecordByEmail(form.collection.Id, authUser.Email)`
- **제공자가 인증했다고 한 이메일만 쓴다.** 인증되지 않은 이메일은 비워 두므로 위 분기에 들어가지 않는다(새 계정 생성 쪽으로 간다).
  - Google: `if extracted.EmailVerified { user.Email = extracted.Email }`
  - Kakao: `if extracted.KakaoAccount.IsEmailValid && extracted.KakaoAccount.IsEmailVerified { user.Email = extracted.KakaoAccount.Email }`
- **미리 만들어 둔 미인증 계정 탈취도 막는다.** 연결 대상 계정이 미인증이면 비밀번호를 무작위로 바꾸고 다른 OAuth 연결을 지운 뒤 인증 처리한다.
  - `if !isLoggedAuthRecord && !e.Record.Verified() { ... e.Record.SetRandomPassword() }`

결론: 미인증 제공자 이메일이 기존 계정에 연결되는 경로는 없다(계정 탈취 우려 없음). 남는 전제는 Google/Kakao의 "인증됨" 표시를 믿는다는 점뿐이다. 부작용: 이메일 인증을 안 한 비밀번호 계정은 같은 이메일로 소셜 로그인하면 비밀번호가 무작위로 바뀐다(비밀번호 찾기로 다시 만들 수 있다).
