# pandoc-svc

`.md` → `*` rendering microservice. Wraps pandoc, typst, marp.

## Endpoints
- `POST /render` — JSON `{ markdown, target, template? }` → binary file stream
- `GET /health` — liveness

## Targets
| target | engine | template type |
|---|---|---|
| pdf | weasyprint via pandoc (Typst path planned) | HTML+CSS |
| docx | pandoc | `.docx` reference-doc |
| html | pandoc standalone | HTML template |
| pptx | marp-cli | CSS theme |
| epub | pandoc | css/metadata |
| xlsx | _planned_ — SheetJS helper | — |

## Templates
Live under `/templates/<target>/<name>.<ext>`. Mounted from repo `templates/`.

## Notes
- Image ~800 MB due to chromium + pandoc + fonts. Trimmable for Pi if PPTX dropped.
- Typst binary downloaded at build (multi-arch: amd64, arm64).
