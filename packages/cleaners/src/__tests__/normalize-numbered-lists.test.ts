import { describe, it, expect } from "vitest";
import { normalizeNumberedLists } from "../regex/normalize-numbered-lists.js";

describe("normalizeNumberedLists", () => {
  it("'1) item' → '1. item'", () => {
    expect(normalizeNumberedLists("1) First item")).toBe("1. First item");
  });

  it("'(1) item' → '1. item'", () => {
    expect(normalizeNumberedLists("(1) First item")).toBe("1. First item");
  });

  it("'a) item' → 'a. item'", () => {
    expect(normalizeNumberedLists("a) First item")).toBe("a. First item");
  });

  it("'(a) item' → 'a. item'", () => {
    expect(normalizeNumberedLists("(a) First item")).toBe("a. First item");
  });

  it("does NOT match mid-sentence 'Section 1)'", () => {
    const input = "See Section 1) for details";
    expect(normalizeNumberedLists(input)).toBe(input);
  });

  it("is idempotent on '1. item'", () => {
    const input = "1. Already correct";
    expect(normalizeNumberedLists(input)).toBe(input);
  });

  it("preserves uppercase alpha (not sub-list pattern)", () => {
    const input = "A) Big item";
    expect(normalizeNumberedLists(input)).toBe(input);
  });

  it("handles multi-digit numbers: '12) item' → '12. item'", () => {
    expect(normalizeNumberedLists("12) Item twelve")).toBe("12. Item twelve");
  });
});
