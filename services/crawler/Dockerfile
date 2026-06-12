# Playwright official image — chromium preinstalled with deps.
# Must match the playwright version pinned in services/crawler/package.json,
# or the bundled browser binaries won't exist (BrowserLaunchError).
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY services/crawler/package.json services/crawler/
RUN pnpm install --frozen-lockfile || pnpm install

COPY tsconfig.base.json ./
COPY services/crawler ./services/crawler

WORKDIR /app/services/crawler
ENV NODE_ENV=production
EXPOSE 8003
CMD ["pnpm", "start"]
