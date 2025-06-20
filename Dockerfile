# 第一阶段：构建前端
FROM node:18 as frontend-builder
WORKDIR /app
COPY frontend/ .

ARG VITE_API_URL=http://localhost:7777
ENV VITE_API_URL=${VITE_API_URL}

RUN yarn install
RUN yarn build --mode production

# 第二阶段：构建Go应用
FROM golang:1.24.4 as builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o main .

# 最终阶段
FROM alpine:latest  
WORKDIR /app
COPY --from=frontend-builder /app/dist ./static
COPY --from=builder /app/main .
CMD ["./main"]