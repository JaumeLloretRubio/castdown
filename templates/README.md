# templates/

Output templates for `md → *` rendering. Live-mounted into `pandoc-svc`.

## Structure
```
templates/
├── pdf/         Typst .typ files (and pandoc HTML/PDF fallback CSS)
├── docx/        Pandoc reference-doc .docx files (style anchors)
├── html/        Pandoc HTML5 templates ($body$, $title$ vars)
├── pptx/        Marp CSS themes
└── epub/        Pandoc EPUB CSS + metadata.xml
```

## Naming convention
`<target>/<name>.<ext>` — passed as `template: "name"` in the API.
Default falls back to a built-in style if `template` is omitted.

## How to add
1. Drop file in correct folder.
2. Restart `pandoc-svc` (or hot-reload via volume mount in dev).
3. Test: `POST /api/cast {"markdown": "...", "target": "pdf", "template": "name"}`
