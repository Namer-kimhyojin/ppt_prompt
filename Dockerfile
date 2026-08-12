# PromptDeck 로컬 서버 (시놀로지 NAS / 도커용)
# Node 20 LTS. 서버 로직은 표준 라이브러리 위주지만 이메일 인증에 nodemailer를 쓴다.
FROM node:20-alpine

WORKDIR /app

# 의존성 캐시 레이어 분리 (package*.json 변경 없으면 npm ci 스킵)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 소스 전체 복사 (정적 파일 + 서버)
COPY . .

# 서버 기본 포트
EXPOSE 4173

# 외부 접속 허용 + 저장 폴더를 마운트 볼륨으로 분리
ENV PROMPTDECK_HOST=0.0.0.0 \
    PROMPTDECK_PORT=4173 \
    PROMPTDECK_OUTPUT_DIR=/data/outputs

# 저장 폴더 생성 (compose에서 볼륨 마운트)
RUN mkdir -p /data/outputs && chown -R node:node /app /data/outputs

USER node

CMD ["node", "server/local-server.js"]
