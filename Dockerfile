# PromptDeck 로컬 서버 (시놀로지 NAS / 도커용)
# Node 20 LTS, 의존성 없이 표준 라이브러리만 사용한다.
FROM node:20-alpine

WORKDIR /app

# 소스 전체 복사 (정적 파일 + 서버)
COPY . .

# 서버 기본 포트
EXPOSE 4173

# 외부 접속 허용 + 저장 폴더를 마운트 볼륨으로 분리
ENV PROMPTDECK_HOST=0.0.0.0 \
    PROMPTDECK_PORT=4173 \
    PROMPTDECK_OUTPUT_DIR=/data/outputs

# 저장 폴더 생성 (compose에서 볼륨 마운트)
RUN mkdir -p /data/outputs

CMD ["node", "server/local-server.js"]
