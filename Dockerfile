FROM --platform=linux/arm64 node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ─── Stage 1: install deps & build ───────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY tsconfig.json tsconfig.base.json ./

COPY lib/db/package.json         ./lib/db/
COPY lib/api-spec/package.json   ./lib/api-spec/
COPY lib/api-zod/package.json    ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/

COPY artifacts/api-server/package.json  ./artifacts/api-server/
COPY artifacts/ryzer-site/package.json  ./artifacts/ryzer-site/

RUN pnpm install --frozen-lockfile

COPY lib      ./lib
COPY artifacts/api-server  ./artifacts/api-server
COPY artifacts/ryzer-site  ./artifacts/ryzer-site

RUN pnpm --filter @workspace/ryzer-site run build
RUN pnpm --filter @workspace/api-server run build

# ─── Stage 2: lean production image ──────────────────────────────────────────
FROM --platform=linux/arm64 node:22-alpine AS runner

WORKDIR /app

COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/ryzer-site/dist  ./frontend

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
