FROM alpine:3.20 AS dl
ARG PB_VERSION=0.40.6
RUN apk add --no-cache unzip ca-certificates
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=dl /pb/pocketbase /pb/pocketbase
COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks
EXPOSE 8090
VOLUME /pb/pb_data
CMD ["/pb/pocketbase","serve","--http=0.0.0.0:8090"]
