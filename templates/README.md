# templates/

Output templates for `md → *` rendering. Live-mounted into `pandoc-svc`.

## Structure
```
templates/
├── pdf/     Typst .typ files — pandoc body + preamble, compiled with typst
├── docx/    Pandoc reference-doc .docx (generate: infra/scripts/gen-reference-docs.sh)
├── html/    Pandoc HTML5 templates ($body$, $title$ vars)
├── pptx/    Pandoc reference-doc .pptx (generate: infra/scripts/gen-reference-docs.sh)
├── epub/    Pandoc EPUB CSS stylesheets
└── latex/   Pandoc LaTeX templates ($body$, $title$, … vars)
```

### Generating binary templates (docx / pptx)

Binary reference-docs are **not committed** (they are derived, not authored).
Generate them once on any machine that has `pandoc` in PATH:

```bash
bash infra/scripts/gen-reference-docs.sh
```

Then open each file in LibreOffice or Microsoft Office to customize styles, and commit
the result to `templates/docx/` or `templates/pptx/`.

## Naming convention
`<target>/<name>.<ext>` — passed as `template: "name"` in the API.
Default falls back to a built-in style if `template` is omitted.

## How to add
1. Drop file in correct folder.
2. Restart `pandoc-svc` (or hot-reload via volume mount in dev).
3. Test: `POST /api/cast {"markdown": "...", "target": "pdf", "template": "name"}`

## Catálogo PDF

### Generales
| Template      | Estilo                                          | Cols | Tamaño | Uso típico                     |
|---------------|-------------------------------------------------|------|--------|--------------------------------|
| `report`      | Brutalist (default castdown)                    | 1    | 10pt   | Reportes internos              |
| `minimal`     | Sans-serif limpio, márgenes amplios             | 1    | 11pt   | Drafts, lectura cómoda         |
| `compact`     | Denso, header paginado, numeración heading 1.1  | 1    | 9pt    | Manuales, dossiers largos      |

### Académicos (estilo visual, NO submission-ready)
| Template          | Mimica           | Cols | Tamaño | Notas                              |
|-------------------|------------------|------|--------|------------------------------------|
| `ieee`            | IEEE Conference  | 2    | 10pt   | Times, justify, headings romanos   |
| `acm`             | ACM sigconf      | 2    | 9pt    | Libertine, blue accent             |
| `springer-lncs`   | Springer LNCS    | 1    | 10pt   | Times, márgenes anchos, sangría    |
| `apa`             | APA 7th          | 1    | 12pt   | Times, doble espaciado, margin 1in |
| `nature`          | Nature Article   | 1    | 10pt   | Sans-serif, header con fecha       |
| `two-column`      | Genérico 2-col   | 2    | 9.5pt  | Sans-serif, neutro                 |
| `thesis`          | Tesis univ.      | 1    | 11pt   | Serif, margen izq. encuadernación  |

### Disclaimer académico
Los templates `ieee`/`acm`/`springer-lncs`/`apa`/`nature` **replican el estilo visual** pero **NO son sustitutos de los class files oficiales** (`IEEEtran.cls`, `acmart.cls`, `llncs.cls`, etc.) que las revistas exigen para submission real. Útiles para:
- Drafts / borradores previos a LaTeX
- Previews para co-autores
- PDFs universitarios / informes de proyecto
- Reportes técnicos con look-and-feel académico

Para submission real → exportar MD a `.tex` (pandoc `-t latex`) y usar la cls del venue.

## Catálogo HTML

| Template      | Estilo                                       |
|---------------|----------------------------------------------|
| `default`     | Brutalist castdown (mono, bordes negros)     |
| `minimal`     | System fonts, limpio, sin bordes             |
| `print`       | Serif Georgia, `@page A4`, page-break hints  |
| `academic`    | Times, justify, sangría párrafo, abstract    |
| `two-column`  | CSS `column-count: 2`, headings span-all     |

## Catálogo PPTX

| Template      | Estilo                | Notas                                             |
|---------------|-----------------------|---------------------------------------------------|
| `default`     | Pandoc default        | Generado con `gen-reference-docs.sh`              |

PPTX usa `--reference-doc`. Para temas propios: crear `.pptx` en LibreOffice Impress
(View → Slide Master), guardar en `templates/pptx/<name>.pptx`.

## Catálogo EPUB

| Template      | Estilo                                          |
|---------------|-------------------------------------------------|
| `default`     | Serif Georgia, márgenes cómodos, tablas limpias |
| `minimal`     | System fonts, ultra-limpio, sin decoración      |
| `print`       | Times, justificado, sangría párrafo, hifenado   |

## Catálogo LaTeX

| Template      | Estilo                                              |
|---------------|-----------------------------------------------------|
| `default`     | article + lmodern, titlesec, booktabs, syntax color |

LaTeX usa `--template`. La salida `.tex` es standalone listo para `pdflatex`/`xelatex`/`lualatex`.
Para submission académica real, exportar con `target: "tex"` y aplicar la `.cls` del venue.

## Catálogo DOCX

| Template      | Estilo                | Notas                                             |
|---------------|-----------------------|---------------------------------------------------|
| `default`     | Pandoc default        | Generado con `gen-reference-docs.sh`              |

DOCX usa `--reference-doc`. Personalizar abriendo el `.docx` en Word/LibreOffice y editando
los estilos (Heading 1, Body Text, Code, etc.), luego re-commitear.
