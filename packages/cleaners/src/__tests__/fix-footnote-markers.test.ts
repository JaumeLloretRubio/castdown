import { describe, it, expect } from "vitest";
import { fixFootnoteMarkers } from "../regex/fix-footnote-markers.js";

describe("fixFootnoteMarkers", () => {
  it("word¹ → word[^1]", () => {
    expect(fixFootnoteMarkers("source¹")).toBe("source[^1]");
  });

  it("word²³ → word[^23]", () => {
    expect(fixFootnoteMarkers("source²³")).toBe("source[^23]");
  });

  it("¹ Nota → [^1]: Nota (standalone footnote def)", () => {
    expect(fixFootnoteMarkers("¹ This is a footnote")).toBe(
      "[^1]: This is a footnote",
    );
  });

  it("² Multi-word footnote", () => {
    expect(fixFootnoteMarkers("² See also chapter 3")).toBe(
      "[^2]: See also chapter 3",
    );
  });

  it("is idempotent on [^1] already correct", () => {
    const input = "source[^1]";
    expect(fixFootnoteMarkers(input)).toBe(input);
  });

  it("preserves code blocks", () => {
    const input = "```\nword¹\n```";
    expect(fixFootnoteMarkers(input)).toBe(input);
  });

  it("does not affect regular numbers", () => {
    const input = "There are 10 items";
    expect(fixFootnoteMarkers(input)).toBe(input);
  });
});
