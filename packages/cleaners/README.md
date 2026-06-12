# castdown-cleaners

[![npm](https://img.shields.io/npm/v/castdown-cleaners)](https://www.npmjs.com/package/castdown-cleaners)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)

Composable Markdown post-processing pipeline. Fixes the dirty output that PDF parsers, DOCX converters, and web crawlers produce before it reaches your LLM or RAG pipeline.

**Works independently with MarkItDown, Docling, Pandoc, LlamaParse, or any tool that outputs Markdown.**

---

## Why

PDF parsers produce ligatures (`ﬁgure` instead of `figure`), broken bullets (`•`), superscript footnotes (`¹`), and HTML entity noise (`&amp;`). DOCX converters leave span artifacts and `{.underline}` syntax. Web crawlers embed UTM tracking params. LLMs and vector databases see all of this as noise — tokens that aren't searchable, chunks that split poorly.

`castdown-cleaners` applies 29 targeted transformations in a validated pipeline to produce clean, normalized Markdown ready for downstream use.

---

## Install

```bash
npm install castdown-cleaners
# or
pnpm add castdown-cleaners
```

---

## Quick start

```typescript
import { clean } from "castdown-cleaners";

const raw = `AT&amp;T Q4 Report\n\n• Revenue grew 15%\n◦ Digital: +22%\n\nﬁgure 1 shows ﬂow of ﬁnancial data.\n\n¹ Preliminary data only`;

const { markdown, applied } = await clean(raw, { source: "pdf" });

console.log(markdown);
// AT&T Q4 Report
//
// - Revenue grew 15%
//   - Digital: +22%
//
// figure 1 shows flow of financial data.
//
// [^1]: Preliminary data only

console.log(applied);
// ["decodeHtmlEntities", "fixLigatures", "normalizeListMarkers",
//  "fixFootnoteMarkers", "remark-normalize"]
```

---

## Usage with MarkItDown

```typescript
import { markitdown } from "markitdown"; // your MarkItDown wrapper
import { clean } from "castdown-cleaners";

const raw = await markitdown.convert("report.pdf");
const { markdown } = await clean(raw, { source: "pdf" });
```

## Usage with Docling

```typescript
import { clean } from "castdown-cleaners";

// Docling output typically comes from HTML conversion path
const raw = await doclingClient.convert("document.pdf");
const { markdown } = await clean(raw.markdown, { source: "pdf" });
```

## Usage with Pandoc / LlamaParse output

```typescript
import { clean } from "castdown-cleaners";

// DOCX via Pandoc
const { markdown } = await clean(pandocOutput, { source: "docx" });

// LlamaParse returns Markdown — treat as unknown source
const { markdown: cleaned } = await clean(llamaParseOutput);
```

---

## API

### `clean(input, opts?): Promise<CleanResult>`

```typescript
interface CleanOptions {
  source?: "pdf" | "docx" | "pptx" | "html" | "epub" | "unknown";
  skip?: string[];           // cleaner names to skip
  stripToc?: boolean;        // remove table of contents (default: false)
  keepNotes?: boolean;       // keep PPTX speaker notes (default: false)
  ligatureMap?: Record<string, string>;  // extend/override ligature map
  extractFrontmatter?: boolean;          // extract YAML frontmatter (default: false)
  frontmatterScanLines?: number;         // lines to scan for metadata (default: 20)
  keepBoilerplate?: boolean;             // keep copyright lines (default: false)
  keepUrlTracking?: boolean;             // keep UTM params (default: false)
}

interface CleanResult {
  markdown: string;
  applied: string[];  // names of cleaners that made changes
}
```

### Individual cleaners

Every cleaner is exported and usable standalone:

```typescript
import {
  decodeHtmlEntities,
  fixLigatures,
  normalizeListMarkers,
  stripUrlTrackingParams,
  // ... all 29 cleaners
} from "castdown-cleaners";

const fixed = fixLigatures("The ﬁrst ﬁgure shows ﬂow.");
// "The first figure shows flow."
```

---

## Pipeline (29 steps)

Steps applied in order. Each is idempotent and skippable via `opts.skip`.

| # | Name | What it fixes |
|---|------|--------------|
| 1 | `decodeHtmlEntities` | `&amp;` `&lt;` `&mdash;` `&#8212;` `&#x2014;` |
| 2 | `normalizeUnicode` | NFC normalization, smart quotes, dashes, ZWSP |
| 3 | `fixLigatures` | `ﬁ`→`fi`, `ﬂ`→`fl`, `ﬃ`→`ffi` (PDF-specific) |
| 4 | `htmlTablesToGfm` | `<table>` → GFM pipe tables |
| 5 | `stripHtmlArtifacts` | `<br>` `<span>` `<b>` `<hr>` `<div>` survivors |
| 6 | `stripDocxArtifacts` | `{.underline}` `{.smallcaps}` DOCX span syntax |
| 7 | `stripPptxNotes` | PPTX speaker note sections |
| 8 | `stripEmptyHeadings` | `## ` blank/punctuation-only headings |
| 9 | `normalizeHorizontalRules` | `======` `————` `* * *` → `---` |
| 10 | `normalizeListMarkers` | `•◦►▸✓✗` → `- / - [x] / - [ ]` |
| 11 | `normalizeNumberedLists` | `1)` `(1)` `a)` `(a)` → `1.` `a.` |
| 12 | `joinSoftHyphens` | Removes soft-hyphen line breaks |
| 13 | `stripPageNumbers` | `— 42 —` page number lines |
| 14 | `stripRepeatedHeaders` | Repeated header/footer text |
| 15 | `detectSpaceTables` | Space-aligned text → GFM tables (PDF) |
| 16 | `joinBrokenLines` | Rejoins hard-wrapped paragraph lines |
| 17 | `fixHeadings` | Promotes/normalizes heading levels |
| 18 | `stripUrlTrackingParams` | `utm_*` `fbclid` `gclid` from links |
| 19 | `dedupeLinks` | Removes duplicate link definitions |
| 20 | `collapseRedundantEmphasis` | `**a** **b**` → `**a b**` |
| 21 | `fixTables` | Repairs malformed GFM tables |
| 22 | `wrapLongCellText` | Wraps overlong table cells |
| 23 | `fixFootnoteMarkers` | `word¹` → `word[^1]`, `¹ text` → `[^1]: text` |
| 24 | `annotateFiguresTables` | Adds `<!-- figure:N -->` markers for RAG |
| 25 | `detectToc` | Marks/removes table of contents |
| 26 | `stripBoilerplate` | Copyright, CONFIDENTIAL, All rights reserved |
| 27 | `normalizeWhitespaceInLines` | Trailing whitespace, whitespace-only lines |
| 28 | `collapseBlankLines` | 3+ blank lines → 2 |
| 29 | `extractMetadataFrontmatter` | Extracts title/date/author as YAML (opt-in) |
| — | `remark-normalize` | Final AST-based normalization via remark+GFM |

---

## Skip specific cleaners

```typescript
const { markdown } = await clean(input, {
  source: "html",
  skip: ["stripBoilerplate", "annotateFiguresTables"],
});
```

---

## Opt-in: extract YAML frontmatter

```typescript
const { markdown } = await clean(input, {
  source: "pdf",
  extractFrontmatter: true,
});
// Prepends --- title/date/author block if found in first 20 lines
```

---

## License

Apache 2.0 — see [LICENSE](LICENSE).

Part of the [castdown](https://github.com/castdown/castdown) toolkit.
