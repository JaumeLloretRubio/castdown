import { describe, it, expect } from "vitest";
import { normalizeWhitespaceInLines } from "../regex/normalize-whitespace-in-lines.js";

describe("normalizeWhitespaceInLines", () => {
  it("whitespace-only line → empty string", () => {
    expect(normalizeWhitespaceInLines("   ")).toBe("");
    expect(normalizeWhitespaceInLines("\t\t")).toBe("");
  });

  it("trailing spaces removed", () => {
    expect(normalizeWhitespaceInLines("hello   ")).toBe("hello");
  });

  it("double-space hard line break (exactly 2) preserved", () => {
    expect(normalizeWhitespaceInLines("line with hard break  ")).toBe(
      "line with hard break  ",
    );
    // 3+ trailing spaces: NOT a hard break, trimmed
    expect(normalizeWhitespaceInLines("trailing   ")).toBe("trailing");
  });

  it("multiple internal spaces collapsed to one", () => {
    expect(normalizeWhitespaceInLines("hello   world")).toBe("hello world");
  });

  it("4-space indentation (code block) preserved", () => {
    const input = "    code indented line";
    expect(normalizeWhitespaceInLines(input)).toBe(input);
  });

  it("is idempotent on clean lines", () => {
    const input = "Normal clean line.";
    expect(normalizeWhitespaceInLines(input)).toBe(input);
  });

  it("preserves fenced code blocks", () => {
    const input = "```\n   spaced   content   \n```";
    expect(normalizeWhitespaceInLines(input)).toBe(input);
  });
});
