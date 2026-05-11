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
import { detectToc } from "./regex/detect-toc.js";

export interface CleanOptions {
  source?: "pdf" | "docx" | "pptx" | "html" | "epub" | "unknown";
  skip?: string[];
  stripToc?: boolean;
}

export interface CleanResult {
  markdown: string;
  applied: string[];
}

type Cleaner = (md: string, opts?: CleanOptions) => string;

const REGEX_PIPELINE: Cleaner[] = [
  normalizeUnicode,
  joinSoftHyphens,
  stripPageNumbers,
  stripRepeatedHeaders,
  joinBrokenLines,
  fixHeadings,
  dedupeLinks,
  fixTables,
  (md, opts) => detectToc(md, { stripToc: opts?.stripToc }),
  collapseBlankLines,
];

// Public names (used in skip lists). Anonymous wrappers get a stable label.
const PIPELINE_NAMES = [
  "normalizeUnicode",
  "joinSoftHyphens",
  "stripPageNumbers",
  "stripRepeatedHeaders",
  "joinBrokenLines",
  "fixHeadings",
  "dedupeLinks",
  "fixTables",
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
  detectToc,
};
