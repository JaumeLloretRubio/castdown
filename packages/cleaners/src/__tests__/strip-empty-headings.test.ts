import { describe, it, expect } from "vitest";
import { stripEmptyHeadings } from "../regex/strip-empty-headings.js";

describe("stripEmptyHeadings", () => {
  it("removes '## ' (heading with only spaces)", () => {
    expect(stripEmptyHeadings("## ")).toBe("");
    expect(stripEmptyHeadings("##   ")).toBe("");
  });

  it("removes '###' (bare hashes)", () => {
    expect(stripEmptyHeadings("###")).toBe("");
    expect(stripEmptyHeadings("######")).toBe("");
  });

  it("removes '# 1.' (number only)", () => {
    expect(stripEmptyHeadings("# 1.")).toBe("");
    expect(stripEmptyHeadings("## 2.3.")).toBe("");
  });

  it("removes '## -' (punctuation only)", () => {
    expect(stripEmptyHeadings("## -")).toBe("");
    expect(stripEmptyHeadings("## :")).toBe("");
    expect(stripEmptyHeadings("## ;")).toBe("");
  });

  it("is idempotent", () => {
    const input = "# Title\n\n## Section";
    expect(stripEmptyHeadings(input)).toBe(input);
  });

  it("preserves '## Introduction'", () => {
    expect(stripEmptyHeadings("## Introduction")).toBe("## Introduction");
  });

  it("preserves '## 1. Introduction' (has text after number)", () => {
    expect(stripEmptyHeadings("## 1. Introduction")).toBe("## 1. Introduction");
  });
});
