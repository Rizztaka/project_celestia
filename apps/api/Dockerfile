# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable pnpm && corepack prepare pnpm@11.18.0 --activate
WORKDIR /app
ENV CI=true

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/api-contracts/package.json packages/api-contracts/package.json
RUN pnpm install --frozen-lockfile
COPY . .
# Configuration requires a URL for generation; this does not connect to a database.
RUN DATABASE_URL=postgresql://unused:unused@localhost:5432/unused pnpm --filter @celestia/api exec prisma generate
RUN pnpm --filter @celestia/api-contracts build && pnpm --filter @celestia/api build
RUN find apps/api/dist -name '*.test.js' -delete
RUN pnpm --filter @celestia/api exec node -e "const fs = require('node:fs'), path = require('node:path'); const generated = require.resolve('.prisma/client/default', {paths: [path.dirname(require.resolve('@prisma/client'))]}); fs.cpSync(path.dirname(generated), '/production/generated', {recursive: true});"
RUN pnpm --filter @celestia/api deploy --legacy --prod /production/api
RUN node -e "require('node:fs').cpSync('/production/generated', '/production/api/node_modules/.prisma/client', {recursive: true})"

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY --from=builder --chown=node:node /production/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/package.json
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --spider -q http://127.0.0.1:4000/api/v1/health/live || exit 1
CMD ["node", "apps/api/dist/index.js"]
