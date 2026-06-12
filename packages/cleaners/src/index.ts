/**
 * Cleaners pipeline — post-process raw MD from parsers (MarkItDown, Pandoc).
 *
 * Composition: regex passes → unified/remark passes → output.
 * Each stage is small, named, testable. Reorder freely.
 */
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";

import { decodeHtmlEntities } from "./regex/decode-html-entities.js";
import { normalizeUnicode } from "./regex/normalize-unicode.js";
import { fixLigatures } from "./regex/fix-ligatures.js";
import { htmlTablesToGfm } from "./regex/html-tables-to-gfm.js";
import { stripHtmlArtifacts } from "./regex/strip-html-artifacts.js";
import { stripDocxArtifacts } from "./regex/strip-docx-artifacts.js";
import { stripPptxNotes } from "./regex/strip-pptx-notes.js";
import { stripEmptyHeadings } from "./regex/strip-empty-headings.js";
import { normalizeHorizontalRules } from "./regex/normalize-horizontal-rules.js";
import { normalizeListMarkers } from "./regex/normalize-list-markers.js";
import { normalizeNumberedLists } from "./regex/normalize-numbered-lists.js";
import { joinSoftHyphens } from "./regex/join-soft-hyphens.js";
import { stripPageNumbers } from "./regex/strip-page-numbers.js";
import { stripRepeatedHeaders } from "./regex/strip-repeated-headers.js";
import { detectSpaceTables } from "./regex/detect-space-tables.js";
import { joinBrokenLines } from "./regex/join-broken-lines.js";
import { fixHeadings } from "./regex/fix-headings.js";
import { stripUrlTrackingParams } from "./regex/strip-url-tracking-params.js";
import { dedupeLinks } from "./regex/dedupe-links.js";
import { collapseRedundantEmphasis } from "./regex/collapse-redundant-emphasis.js";
import { fixTables } from "./regex/fix-tables.js";
import { wrapLongCellText } from "./regex/wrap-long-cell-text.js";
import { fixFootnoteMarkers } from "./regex/fix-footnote-markers.js";
import { annotateFiguresTables } from "./regex/annotate-figures-tables.js";
import { detectToc } from "./regex/detect-toc.js";
import { stripBoilerplate } from "./regex/strip-boilerplate.js";
import { normalizeWhitespaceInLines } from "./regex/normalize-whitespace-in-lines.js";
import { collapseBlankLines } from "./regex/collapse-blank-lines.js";
import { extractMetadataFrontmatter } from "./regex/extract-metadata-frontmatter.js";

export interface CleanOptions {
  source?: "pdf" | "docx" | "pptx" | "html" | "epub" | "unknown";
  skip?: string[];
  stripToc?: boolean;
  keepNotes?: boolean;
  ligatureMap?: Record<string, string>;
  extractFrontmatter?: boolean;
  frontmatterScanLines?: number;
  keepBoilerplate?: boolean;
  keepUrlTracking?: boolean;
}

export interface CleanResult {
  markdown: string;
  applied: string[];
}

type Cleaner = (md: string, opts?: CleanOptions) => string;

interface PipelineStep {
  name: string;
  fn: Cleaner;
}

const PIPELINE: PipelineStep[] = [
  { name: "decodeHtmlEntities",       fn: decodeHtmlEntities },
  { name: "normalizeUnicode",         fn: normalizeUnicode },
  { name: "fixLigatures",             fn: fixLigatures },
  { name: "htmlTablesToGfm",          fn: htmlTablesToGfm },
  { name: "stripHtmlArtifacts",       fn: stripHtmlArtifacts },
  {
    name: "stripDocxArtifacts",
    fn: (md, opts) => (opts?.source === "docx" ? stripDocxArtifacts(md) : md),
  },
  {
    name: "stripPptxNotes",
    fn: (md, opts) =>
      opts?.source === "pptx" && !opts?.keepNotes ? stripPptxNotes(md) : md,
  },
  { name: "stripEmptyHeadings",       fn: stripEmptyHeadings },
  { name: "normalizeHorizontalRules", fn: normalizeHorizontalRules },
  { name: "normalizeListMarkers",     fn: normalizeListMarkers },
  { name: "normalizeNumberedLists",   fn: normalizeNumberedLists },
  { name: "joinSoftHyphens",          fn: joinSoftHyphens },
  { name: "stripPageNumbers",         fn: stripPageNumbers },
  { name: "stripRepeatedHeaders",     fn: stripRepeatedHeaders },
  {
    name: "detectSpaceTables",
    fn: (md, opts) => (opts?.source === "pdf" ? detectSpaceTables(md) : md),
  },
  { name: "joinBrokenLines",          fn: joinBrokenLines },
  { name: "fixHeadings",              fn: fixHeadings },
  {
    name: "stripUrlTrackingParams",
    fn: (md, opts) =>
      opts?.keepUrlTracking ? md : stripUrlTrackingParams(md),
  },
  { name: "dedupeLinks",              fn: dedupeLinks },
  { name: "collapseRedundantEmphasis", fn: collapseRedundantEmphasis },
  { name: "fixTables",                fn: fixTables },
  { name: "wrapLongCellText",         fn: wrapLongCellText },
  { name: "fixFootnoteMarkers",       fn: fixFootnoteMarkers },
  { name: "annotateFiguresTables",    fn: annotateFiguresTables },
  {
    name: "detectToc",
    fn: (md, opts) => detectToc(md, { stripToc: opts?.stripToc }),
  },
  { name: "stripBoilerplate",         fn: stripBoilerplate },
  { name: "normalizeWhitespaceInLines", fn: normalizeWhitespaceInLines },
  { name: "collapseBlankLines",       fn: collapseBlankLines },
  { name: "extractMetadataFrontmatter", fn: extractMetadataFrontmatter },
];

export async function clean(input: string, opts: CleanOptions = {}): Promise<CleanResult> {
  const applied: string[] = [];
  let md = input;

  for (const step of PIPELINE) {
    if (opts.skip?.includes(step.name)) continue;
    const before = md;
    md = step.fn(md, opts);
    if (md !== before) applied.push(step.name);
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
  decodeHtmlEntities,
  normalizeUnicode,
  fixLigatures,
  htmlTablesToGfm,
  stripHtmlArtifacts,
  stripDocxArtifacts,
  stripPptxNotes,
  stripEmptyHeadings,
  normalizeHorizontalRules,
  normalizeListMarkers,
  normalizeNumberedLists,
  joinSoftHyphens,
  stripPageNumbers,
  stripRepeatedHeaders,
  detectSpaceTables,
  joinBrokenLines,
  fixHeadings,
  stripUrlTrackingParams,
  dedupeLinks,
  collapseRedundantEmphasis,
  fixTables,
  wrapLongCellText,
  fixFootnoteMarkers,
  annotateFiguresTables,
  detectToc,
  stripBoilerplate,
  normalizeWhitespaceInLines,
  collapseBlankLines,
  extractMetadataFrontmatter,
};
