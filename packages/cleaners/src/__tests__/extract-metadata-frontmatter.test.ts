import { describe, it, expect } from "vitest";
import { extractMetadataFrontmatter } from "../regex/extract-metadata-frontmatter.js";

describe("extractMetadataFrontmatter", () => {
  it("noop when extractFrontmatter not enabled", () => {
    const input = "# My Title\n\nContent.";
    expect(extractMetadataFrontmatter(input)).toBe(input);
  });

  it("extracts H1 as title", () => {
    const input = "# My Report\n\nContent.";
    const result = extractMetadataFrontmatter(input, {
      extractFrontmatter: true,
    });
    expect(result).toContain('title: "My Report"');
    expect(result).toContain("---\n");
  });

  it("extracts Date: field", () => {
    const input = "# Doc\nDate: 2026-01-15\n\nContent.";
    const result = extractMetadataFrontmatter(input, {
      extractFrontmatter: true,
    });
    expect(result).toContain('date: "2026-01-15"');
  });

  it("skips if front matter already exists", () => {
    const input = "---\ntitle: Already\n---\n\nContent.";
    const result = extractMetadataFrontmatter(input, {
      extractFrontmatter: true,
    });
    expect(result).toBe(input);
  });

  it("preserves body content after frontmatter", () => {
    const input = "# Title\n\nBody text here.";
    const result = extractMetadataFrontmatter(input, {
      extractFrontmatter: true,
    });
    expect(result).toContain("Body text here.");
  });

  it("is idempotent (second call skips because front matter exists)", () => {
    const input = "# Doc\n\nContent.";
    const first = extractMetadataFrontmatter(input, {
      extractFrontmatter: true,
    });
    const second = extractMetadataFrontmatter(first, {
      extractFrontmatter: true,
    });
    expect(second).toBe(first);
  });
});
