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
