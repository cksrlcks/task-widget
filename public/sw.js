// 설치(홈 화면 추가)용 최소 서비스 워커. 데이터는 늘 서버에서 받아 오므로 캐시하지 않는다
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()))
self.addEventListener("fetch", () => {})
