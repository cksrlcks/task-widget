FROM alpine:3.20 AS dl
ARG PB_VERSION=0.40.6
RUN apk add --no-cache unzip ca-certificates wget
# 라즈베리파이(ARM)에서도 빌드되도록 빌드하는 기계의 CPU에 맞는 바이너리를 받는다
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
COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks
EXPOSE 8090
VOLUME /pb/pb_data
CMD ["/pb/pocketbase","serve","--http=0.0.0.0:8090"]
