import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { clean } from "../index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(__dirname, "../../fixtures");

describe("corpus: dirty-pdf", () => {
  it("cleans realistic PDF parser output", async () => {
    const input = await readFile(resolve(fixtures, "dirty-pdf.in.md"), "utf8");
    const { markdown, applied } = await clean(input, { source: "pdf" });

    // Page number stripped
    expect(markdown).not.toMatch(/Page \d+ of \d+/);
    // Repeated footer stripped
    expect(markdown).not.toMatch(/Manual de Operaciones · Edición 2026/);
    // Soft hyphen joined
    expect(markdown).toMatch(/ejemplo/);
    expect(markdown).not.toMatch(/ejem-\nplo/);
    // Duplicate adjacent link collapsed
    const linkOccurrences = markdown.match(/\[Click here\]\(https:\/\/example\.com\)/g) ?? [];
    expect(linkOccurrences.length).toBe(1);
    // Multiple cleaners contributed
    expect(applied.length).toBeGreaterThanOrEqual(3);
  });
});

describe("corpus: dirty-docx", () => {
  it("strips pandoc span attributes from DOCX output", async () => {
    const input = await readFile(resolve(fixtures, "dirty-docx.in.md"), "utf8");
    const { markdown, applied } = await clean(input, { source: "docx" });

    // Span attributes stripped
    expect(markdown).not.toMatch(/\{\.underline\}/);
    expect(markdown).not.toMatch(/\{\.smallcaps\}/);
    expect(markdown).not.toMatch(/\{\.mark\}/);
    expect(markdown).not.toMatch(/\{\.highlight\}/);
    // Strikethrough converted to GFM
    expect(markdown).toMatch(/~~texto también tachado~~/);
    // &nbsp; replaced
    expect(markdown).not.toMatch(/&nbsp;/);
    // HTML tables converted to GFM (remark-gfm pads columns, so match without exact spacing)
    expect(markdown).toMatch(/\|\s*Métrica\s*\|/);
    expect(markdown).not.toMatch(/<table/i);
    // Cleaner ran
    expect(applied).toContain("stripDocxArtifacts");
  });
});

describe("corpus: dirty-pptx", () => {
  it("strips speaker notes sections from PPTX output", async () => {
    const input = await readFile(resolve(fixtures, "dirty-pptx.in.md"), "utf8");
    const { markdown, applied } = await clean(input, { source: "pptx" });

    // Speaker notes removed
    expect(markdown).not.toMatch(/Gartner Q1 2026/);
    expect(markdown).not.toMatch(/board meeting del 15 de abril/);
    expect(markdown).not.toMatch(/plan de contratación/);
    // Slide content preserved
    expect(markdown).toMatch(/Estrategia de Producto/);
    expect(markdown).toMatch(/Objetivos estratégicos/);
    expect(markdown).toMatch(/Hoja de ruta/);
    // Cleaner ran
    expect(applied).toContain("stripPptxNotes");
  });

  it("keeps notes when keepNotes=true", async () => {
    const input = await readFile(resolve(fixtures, "dirty-pptx.in.md"), "utf8");
    const { markdown } = await clean(input, { source: "pptx", keepNotes: true });
    expect(markdown).toMatch(/Gartner Q1 2026/);
  });
});

describe("corpus: dirty-toc", () => {
  it("wraps detected TOC", async () => {
    const input = await readFile(resolve(fixtures, "dirty-toc.in.md"), "utf8");
    const { markdown, applied } = await clean(input);
    expect(markdown).toMatch(/<!-- toc:start -->/);
    expect(applied).toContain("detectToc");
  });

  it("strips TOC when stripToc=true", async () => {
    const input = await readFile(resolve(fixtures, "dirty-toc.in.md"), "utf8");
    const { markdown } = await clean(input, { stripToc: true });
    expect(markdown).not.toMatch(/Capítulo 1 ─{0,3}\.+\s*5/);
    expect(markdown).toMatch(/Texto del capítulo uno/);
  });
});
