FROM --platform=linux/arm64 node:22-alpine

WORKDIR /app

COPY dist/api      ./dist
COPY dist/frontend ./frontend

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
