# PocketBase 서버 + 웹(PWA) 빌드. 빌드 컨텍스트는 저장소 루트다(Dokploy Build Path: /)

# 1) 웹 앱 빌드: PocketBase와 같은 주소에서 서비스하므로 API 주소는 "/"
FROM node:24-slim AS web
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig*.json components.json ./
COPY public ./public
COPY src ./src
RUN VITE_PB_URL=/ npx vite build

# 2) PocketBase: 라즈베리파이(ARM)에서도 빌드되도록 빌드하는 기계의 CPU에 맞는 바이너리를 받는다
FROM alpine:3.20 AS dl
ARG PB_VERSION=0.40.6
RUN apk add --no-cache unzip ca-certificates wget
RUN case "$(uname -m)" in \
      aarch64|arm64) ARCH=arm64 ;; \
      armv7l|armhf) ARCH=armv7 ;; \
      *) ARCH=amd64 ;; \
    esac \
 && wget -qO /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${ARCH}.zip" \
 && unzip /tmp/pb.zip -d /pb

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=dl /pb/pocketbase /pb/pocketbase
COPY server/pb_migrations /pb/pb_migrations
COPY server/pb_hooks /pb/pb_hooks
COPY --from=web /app/dist /pb/pb_public
EXPOSE 8090
VOLUME /pb/pb_data
CMD ["/pb/pocketbase","serve","--http=0.0.0.0:8090"]
