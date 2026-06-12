# castdown

> Cast anything down to Markdown.

Self-hostable conversion toolkit: `* → .md`, `.md → *`, `URL → tree of .md`, plus an MCP server for agents.

**Status:** `0.1.0` — all services operational. E2E validated locally.

## What's here
```
castdown/
├── apps/
│   └── web/                  Next.js 15 frontend
├── services/
│   ├── api/                  Hono gateway — auth, rate limit, routing
│   ├── markitdown/           Python FastAPI + MarkItDown (file → md)
│   ├── pandoc/               Node + pandoc + typst + marp (md → *)
│   └── crawler/              Node + Playwright + Readability (URL → tree)
├── packages/
│   ├── cleaners/             Regex + remark post-processors
│   ├── mcp/                  castdown-mcp npm package
│   └── shared/               Zod schemas + types
├── templates/
│   ├── pdf/                  Typst templates
│   ├── tex/                  LaTeX templates
│   ├── docx/                 Pandoc reference docs
│   ├── html/                 Pandoc HTML5 templates
│   ├── epub/                 EPUB templates
│   └── pptx/                 Marp / pptx themes
├── infra/
│   └── caddy/                Reverse proxy config
└── docker-compose.yml        Full stack
```

## Quickstart (local dev)
```bash
cp .env.example .env
docker compose up --build
curl http://localhost:3001/health
```

Default stack (sin `--profile`): `api`, `markitdown-svc`, `pandoc-svc`, `crawler-svc`, `redis`.

Para incluir UI + Caddy reverse-proxy (modo full cloud / self-host completo):
```bash
docker compose --profile cloud up --build
```

API key dev (default): `cd_dev_changeme` — cámbiala en `.env` ya.

## Deploy: Raspberry Pi + Vercel (gratis)

Arquitectura: stack en Pi de casa, UI en Vercel free, conexión via Tailscale Funnel (HTTPS público sin port-forward).

### En la Pi
```bash
git clone https://github.com/JaumeLloretRubio/castdown ~/castdown
bash ~/castdown/infra/scripts/install-pi.sh
```

El script instala Docker, Tailscale, levanta el stack, genera una API key random y deja `.env` listo. Luego:

```bash
sudo tailscale up                          # login en navegador
# habilita Funnel en https://login.tailscale.com/admin (1 vez)
sudo tailscale funnel --bg 3001            # expone :3001 vía HTTPS
sudo tailscale funnel status               # imprime URL *.ts.net
```

### En Vercel
1. New Project → import repo → root directory = raíz (lee `vercel.json`).
2. Env vars (Production + Preview):
   - `CASTDOWN_API_URL` = `https://<tu>.ts.net`
   - `CASTDOWN_API_KEY` = la generada por `install-pi.sh`
3. Deploy. URL = `https://castdown-xxx.vercel.app`.
4. Vuelve a la Pi → edita `.env` → `WEB_ORIGIN=http://localhost:3000,https://castdown-xxx.vercel.app` → `docker compose restart api`.

### Privacidad
- Web Vercel marcada `noindex,nofollow` (robots.txt + meta + X-Robots-Tag).
- Backend Pi sólo accesible vía API key (Bearer token).
- Browser **nunca** ve la key — Next.js middleware la inyecta server-side en cada `/api/*`.
- CORS restringido al dominio Vercel.

### Migración a VPS (cuando saltes de Pi)
Mismo `docker-compose.yml`. `docker compose --profile cloud up -d --build` levanta también web + Caddy. Sin tunnel, Caddy gestiona TLS contra dominio propio. Cero cambios de código.

## Goals
1. **Quality output** via internal cleaners (regex + remark) and curated templates (Typst/Pandoc/Marp).
2. **Self-hostable on a Raspberry Pi 5** (8GB recommended) or any Linux box.
3. **Free-tier cloud path** for scaling beyond a Pi.
4. **MCP-first** — agent usage is a primary, not bolted-on, interface.

## Stack at a glance
- **Edge:** Caddy (HTTPS, reverse proxy) or Cloudflare Tunnel
- **Gateway:** Hono on Node 20
- **Conversion engines:** MarkItDown · Pandoc · Typst · Marp · Tesseract · LibreOffice
- **Crawler:** Crawlee + Playwright + Readability + Turndown
- **Queue:** Redis (BullMQ planned)
- **DB:** SQLite (Litestream optional) → Postgres at scale
- **Storage:** filesystem with TTL cleanup
- **Frontend:** Next.js 15

## License
Apache 2.0 — see [LICENSE](LICENSE).
