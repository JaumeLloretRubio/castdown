# @castdown/cli

CLI client for a running castdown API.

## Install (dev)
```bash
pnpm -F @castdown/cli install
pnpm -F @castdown/cli start cast ./report.pdf > report.md
```

## Env
- `CASTDOWN_API_URL` — default `http://localhost:3001`
- `CASTDOWN_API_KEY` — default `cd_dev_changeme`

## Commands
```
castdown cast <file>                       → markdown to stdout
castdown render <md> --to docx -o out.docx
castdown crawl https://docs.example.com --depth 2 -o site.zip
castdown health
```

## Flags
| flag | meaning |
|---|---|
| `--to` | target format (pdf/docx/html/pptx/epub) |
| `--template` | template name (e.g. `report`) |
| `--depth` | crawl depth (default 2) |
| `--max-pages` | crawl page cap (default 100) |
| `--skip c1,c2` | skip specific cleaners (cast only) |
| `--raw` | skip cleaners entirely (cast only) |
| `-o, --output` | output file (default stdout) |
