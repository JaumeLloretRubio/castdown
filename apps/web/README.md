# @castdown/web

Next.js 15 frontend (App Router, React 19, Tailwind).

## Dev
```bash
pnpm -F @castdown/web install
pnpm -F @castdown/web dev
# → http://localhost:3000
```

The app rewrites `/api/*` and `/health` to the gateway. Gateway URL:
`http://localhost:3001` por defecto, override con `CASTDOWN_API_URL` (server-only).

**Auth model (cambió en sesión 09):** `middleware.ts` inyecta `Authorization: Bearer`
server-side antes del rewrite, usando `process.env.CASTDOWN_API_KEY`. El browser
nunca envía la key.

- En `next dev` sin var → fallback automático a `cd_dev_changeme`.
- En Vercel deploy → setea `CASTDOWN_API_KEY` en project env vars (NO prefijo
  `NEXT_PUBLIC_`, debe ser server-only).

`SettingsModal` sigue presente pero su rol cambia: el botón TEST valida una key
candidata contra la gateway; el botón SAVE persiste en `localStorage` pero ya
NO afecta las llamadas reales (middleware ignora localStorage). Útil sólo para
probar claves antes de moverlas a Vercel env.

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
