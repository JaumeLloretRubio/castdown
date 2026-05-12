/**
 * Cleaners pipeline — post-process raw MD from parsers (MarkItDown, Pandoc).
 *
 * Composition: regex passes → unified/remark passes → output.
 * Each stage is small, named, testable. Reorder freely.
 */
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";

import { stripPageNumbers } from "./regex/strip-page-numbers.js";
import { stripRepeatedHeaders } from "./regex/strip-repeated-headers.js";
import { joinSoftHyphens } from "./regex/join-soft-hyphens.js";
import { joinBrokenLines } from "./regex/join-broken-lines.js";
import { collapseBlankLines } from "./regex/collapse-blank-lines.js";
import { normalizeUnicode } from "./regex/normalize-unicode.js";
import { fixHeadings } from "./regex/fix-headings.js";
import { dedupeLinks } from "./regex/dedupe-links.js";
import { fixTables } from "./regex/fix-tables.js";
import { htmlTablesToGfm } from "./regex/html-tables-to-gfm.js";
import { detectSpaceTables } from "./regex/detect-space-tables.js";
import { detectToc } from "./regex/detect-toc.js";
import { stripDocxArtifacts } from "./regex/strip-docx-artifacts.js";
import { stripPptxNotes } from "./regex/strip-pptx-notes.js";
import { wrapLongCellText } from "./regex/wrap-long-cell-text.js";

export interface CleanOptions {
  source?: "pdf" | "docx" | "pptx" | "html" | "epub" | "unknown";
  skip?: string[];
  stripToc?: boolean;
  keepNotes?: boolean;  // pptx: retain speaker notes instead of stripping
}

export interface CleanResult {
  markdown: string;
  applied: string[];
}

type Cleaner = (md: string, opts?: CleanOptions) => string;

const REGEX_PIPELINE: Cleaner[] = [
  normalizeUnicode,
  htmlTablesToGfm,
  // Source-specific pre-passes: run before generic cleaners so later passes
  // see clean markdown instead of format-specific noise.
  (md, opts) => (opts?.source === "docx" ? stripDocxArtifacts(md) : md),
  (md, opts) => (opts?.source === "pptx" && !opts?.keepNotes ? stripPptxNotes(md) : md),
  joinSoftHyphens,
  stripPageNumbers,
  stripRepeatedHeaders,
  (md, opts) => (opts?.source === "pdf" ? detectSpaceTables(md) : md),
  joinBrokenLines,
  fixHeadings,
  dedupeLinks,
  fixTables,
  wrapLongCellText,
  (md, opts) => detectToc(md, { stripToc: opts?.stripToc }),
  collapseBlankLines,
];

// Public names (used in skip lists). Anonymous wrappers get a stable label.
const PIPELINE_NAMES = [
  "normalizeUnicode",
  "htmlTablesToGfm",
  "stripDocxArtifacts",
  "stripPptxNotes",
  "joinSoftHyphens",
  "stripPageNumbers",
  "stripRepeatedHeaders",
  "detectSpaceTables",
  "joinBrokenLines",
  "fixHeadings",
  "dedupeLinks",
  "fixTables",
  "wrapLongCellText",
  "detectToc",
  "collapseBlankLines",
];

export async function clean(input: string, opts: CleanOptions = {}): Promise<CleanResult> {
  const applied: string[] = [];
  let md = input;

  for (let i = 0; i < REGEX_PIPELINE.length; i++) {
    const name = PIPELINE_NAMES[i]!;
    if (opts.skip?.includes(name)) continue;
    const before = md;
    md = REGEX_PIPELINE[i]!(md, opts);
    if (md !== before) applied.push(name);
  }

  const file = await remark()
    .use(remarkGfm)
    .use(remarkStringify, {
      bullet: "-",
      fences: true,
      listItemIndent: "one",
      rule: "-",
    })
    .process(md);
  md = String(file);
  applied.push("remark-normalize");

  return { markdown: md, applied };
}

export {
  stripPageNumbers,
  stripRepeatedHeaders,
  joinSoftHyphens,
  joinBrokenLines,
  collapseBlankLines,
  normalizeUnicode,
  fixHeadings,
  dedupeLinks,
  fixTables,
  htmlTablesToGfm,
  detectSpaceTables,
  detectToc,
  stripDocxArtifacts,
  stripPptxNotes,
  wrapLongCellText,
};
