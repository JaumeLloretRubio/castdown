# crawler-svc

URL → tree-of-`.md` microservice. Playwright + Crawlee + Readability + Turndown.

## Endpoints
- `POST /crawl` — JSON `{ url, depth, format, max_pages, render_js }` → ZIP/JSON stream
- `GET /health` — liveness

## Strategy
1. Playwright renders pages (SPAs supported).
2. Readability extracts main content (drops nav/footer/ads).
3. Turndown converts to MD.
4. Internal links rewritten to relative `.md` paths.
5. Output bundled as ZIP with `index.md` table of contents.

## Pi notes
- Chromium ≈ 200-300 MB RAM per page. Default `CRAWLER_MAX_CONCURRENCY=2`. Pi 4 4GB: drop to 1.
- Long crawls may exhaust RAM. Use `max_pages` aggressively on Pi.
