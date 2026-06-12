FROM node:24-bookworm-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

# Builder — compile native modules (better-sqlite3) with toolchain
FROM base AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY services/api/package.json services/api/
COPY packages/shared/package.json packages/shared/
COPY packages/cleaners/package.json packages/cleaners/
COPY packages/storage/package.json packages/storage/
RUN pnpm install --frozen-lockfile || pnpm install

# Runtime — slim, no build toolchain. Drops ~250MB vs single-stage.
FROM base AS runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/api/node_modules ./services/api/node_modules
COPY tsconfig.base.json ./
COPY packages ./packages
# Workspace packages resolve to src/ in-repo, so their runtime deps
# (e.g. cleaners → remark/unified) must ship from the builder's node_modules.
COPY --from=builder /app/packages/cleaners/node_modules ./packages/cleaners/node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY services/api ./services/api
WORKDIR /app/services/api
ENV NODE_ENV=production
EXPOSE 3001
CMD ["pnpm", "start"]
