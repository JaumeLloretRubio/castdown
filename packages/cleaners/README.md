# @castdown/cleaners

Post-processing pipeline for raw markdown emitted by MarkItDown/Pandoc.

## Usage
```ts
import { clean } from "@castdown/cleaners";

const { markdown, applied } = await clean(rawMd, { source: "pdf" });
console.log(applied); // ["normalizeUnicode", "joinSoftHyphens", ...]
```

## Pipeline
1. **Regex passes** — order-sensitive, idempotent each:
   - `normalizeUnicode` — NFC, smart quotes → straight, soft-hyphen strip
   - `joinSoftHyphens` — PDF line-end hyphen joiner
   - `stripPageNumbers` — page markers
   - `stripRepeatedHeaders` — running headers/footers (≥4 occurrences)
   - `joinBrokenLines` — PDF column wraps
   - `collapseBlankLines` — `\n{3,}` → `\n\n`
2. **AST pass** — `remark` + `remark-gfm` re-stringify normalizes tables, lists, code fences.

## Adding a cleaner
1. Create `src/regex/<name>.ts` exporting `function name(md: string, opts?): string`.
2. Add to `REGEX_PIPELINE` in `src/index.ts`.
3. Add tests in `src/__tests__/`.
