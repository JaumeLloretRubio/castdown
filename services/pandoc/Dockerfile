# Multi-stage: install pandoc + typst + weasyprint deps + node + marp-cli
FROM node:20-bookworm-slim AS base

ENV DEBIAN_FRONTEND=noninteractive

# System tools: weasyprint deps, fonts, typst + pandoc (binaries), chromium (for marp)
# NOTE: pandoc is NOT installed from apt — bookworm ships 2.17 which lacks the
# `typst` writer (needs pandoc >= 3.0). Installed from the official release below.
RUN apt-get update && apt-get install -y --no-install-recommends \
    weasyprint \
    fonts-dejavu \
    fonts-jetbrains-mono \
    curl \
    ca-certificates \
    xz-utils \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Pandoc — official release deb (apt's 2.17 has no typst writer; need >= 3.0)
ARG PANDOC_VERSION=3.5
RUN ARCH=$(dpkg --print-architecture) \
    && curl -fsSL "https://github.com/jgm/pandoc/releases/download/${PANDOC_VERSION}/pandoc-${PANDOC_VERSION}-1-${ARCH}.deb" -o /tmp/pandoc.deb \
    && dpkg -i /tmp/pandoc.deb \
    && rm /tmp/pandoc.deb

# Typst — download static binary (multi-arch)
ARG TYPST_VERSION=0.12.0
RUN ARCH=$(dpkg --print-architecture) \
    && case "$ARCH" in \
         amd64) TYPST_ARCH=x86_64-unknown-linux-musl ;; \
         arm64) TYPST_ARCH=aarch64-unknown-linux-musl ;; \
         *) echo "unsupported arch $ARCH" && exit 1 ;; \
       esac \
    && curl -fsSL "https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-${TYPST_ARCH}.tar.xz" \
       | tar -xJ -C /usr/local/bin --strip-components=1 "typst-${TYPST_ARCH}/typst"

# Marp CLI (chromium provided via apt)
ENV CHROME_PATH=/usr/bin/chromium
RUN npm install -g @marp-team/marp-cli@4.0.4

RUN corepack enable && corepack prepare pnpm@9.12.0 --activate

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY services/pandoc/package.json services/pandoc/
RUN pnpm install --frozen-lockfile || pnpm install

COPY tsconfig.base.json ./
COPY services/pandoc ./services/pandoc
COPY templates ./templates

ENV TEMPLATES_DIR=/app/templates
WORKDIR /app/services/pandoc
EXPOSE 8002
CMD ["pnpm", "start"]
