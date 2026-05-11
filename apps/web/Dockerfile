FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile || pnpm install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY tsconfig.base.json ./
COPY apps/web ./apps/web
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
# Activa `output: "standalone"` en next.config.mjs sólo durante build Docker.
# En Vercel esta var no está set → Next.js sirve normal.
ENV DOCKER_BUILD=1
RUN pnpm build

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
