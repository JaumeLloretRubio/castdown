# @castdown/web

Next.js 15 frontend (App Router, React 19, Tailwind).

## Dev
```bash
pnpm -F @castdown/web install
pnpm -F @castdown/web dev
# → http://localhost:3000
```

The app rewrites `/api/*` and `/health` to the gateway. Default gateway URL:
`http://localhost:3001`. Override with `NEXT_PUBLIC_API_URL`.

API key is read from `localStorage["cd_api_key"]`. Default fallback:
`cd_dev_changeme`. Set it from devtools or build a settings drawer (TODO).

## Architecture
- `app/page.tsx` — single landing page composing all sections.
- `app/layout.tsx` — root layout, loads JetBrains Mono via Google Fonts.
- `app/globals.css` — Tailwind base + brutalist primitives (`.btn`, `.pill`, `.sec-head`).
- `components/` — one file per section. Client components are marked with `"use client"`.
- `lib/api.ts` — thin fetch wrappers around the gateway.
- `lib/activity.ts` — pub-sub for the live log (no zustand/redux needed).

## Why no shadcn / component library
The whole point of the brutalist aesthetic is to *not* look like every other React SaaS.
All primitives are hand-rolled. If you find yourself reaching for shadcn, ask whether
the result will still feel like this product.
