# 릴리스 가이드

## 최초 1회 설정

1. **GitHub 주소 치환** — `src-tauri/tauri.conf.json`의 `plugins.updater.endpoints`에 있는 `OWNER/REPO`를 실제 `소유자/저장소`로 바꾼다. 최종: `https://github.com/<소유자>/<저장소>/releases/latest/download/latest.json`. release.yml은 저장소를 자동으로 쓰므로 바꿀 곳이 없다.
2. **서명 키** — `~/.tauri/task-widget.key`(비밀키, 비밀번호 없음)와 `.pub`가 이미 생성돼 있다. 공개키는 `tauri.conf.json`에 들어 있다.
   - 비밀키는 저장소에 절대 커밋하지 않는다. 키를 잃어버리면 기존 설치본은 자동 업데이트를 못 받는다(백업할 것).
   - GitHub 저장소 → Settings → Secrets and variables → Actions에 추가:
     - `TAURI_SIGNING_PRIVATE_KEY`: `task-widget.key` 파일 내용 전체
     - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: 빈 값
     - `VITE_PB_URL`: 배포한 PocketBase 주소
   - 비밀번호를 걸고 싶으면 `npx tauri signer generate -w ~/.tauri/task-widget.key`로 다시 만들고, 새 공개키를 `tauri.conf.json`에 넣고, 비밀번호를 위 시크릿에 넣는다. 공개키가 바뀌면 이미 설치된 앱은 업데이트할 수 없다(재설치 필요).
3. **PocketBase 서버 배포** — [server/README.md](../server/README.md) 참고.

## 릴리스 절차

1. `package.json`의 `version`을 올린다(예: `0.1.1`). `tauri.conf.json`의 `version`은 `../package.json`을 따르므로 그대로 둔다. `src-tauri/Cargo.toml`의 version도 맞춰 두면 좋다.
2. 커밋 후 태그를 만들어 푸시한다.
   ```
   git commit -am "chore: release v0.1.1"
   git tag v0.1.1
   git push origin HEAD v0.1.1
   ```
3. GitHub Actions의 Release 워크플로가 끝나면 Releases에 설치 파일(`.exe`/`.msi`), `.sig`, `latest.json`이 올라온다. 확인한다.
4. 설치된 이전 버전 앱은 시작 30초 뒤 새 버전을 알리고, "업데이트"를 누르면 설치 후 재시작한다.

## SmartScreen 안내 (코드 서명 없음)

코드 서명 인증서 없이 배포하므로 처음 실행할 때 "Windows의 PC 보호" 화면이 뜰 수 있다. 사용자 안내 문구:

> "Windows의 PC 보호" 창이 나오면 **추가 정보**를 누른 뒤 **실행**을 누르세요.

## 소셜 로그인 프로덕션 체크리스트

### Google OAuth 동의 화면
- 게시 상태를 "테스트"에서 "프로덕션"으로 전환(테스트 상태는 등록한 테스트 사용자만 로그인 가능)
- 앱 이름 입력
- 개인정보처리방침 URL 입력
- 사용자 지원 이메일, 개발자 연락처 이메일 입력
- 승인된 리디렉션 URI에 PocketBase의 OAuth 콜백 주소 등록

### Kakao
- 카카오 디벨로퍼스 → 앱 → 동의항목에서 **카카오계정(이메일)** 을 설정(필수 동의 권장). 이메일이 없으면 계정 생성이 막힌다.
- 이메일 동의항목은 비즈 앱 전환이 필요할 수 있다.
- Redirect URI에 PocketBase의 OAuth 콜백 주소 등록
