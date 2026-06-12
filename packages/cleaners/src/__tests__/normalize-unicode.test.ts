import { describe, it, expect } from "vitest";
import { normalizeUnicode } from "../regex/normalize-unicode.js";

describe("normalizeUnicode — split accent recomposition", () => {
  it("composes an adjacent combining mark (plain NFD)", () => {
    const nfd = "conversión"; // o + combining acute
    expect(normalizeUnicode(nfd)).toBe("conversión");
  });

  it("reattaches a combining mark detached by a space", () => {
    const split = "conversio ́n"; // o, space, combining acute
    expect(normalizeUnicode(split)).toBe("conversión");
  });

  it("converts a spacing acute after the letter (o´ → ó)", () => {
    expect(normalizeUnicode("conversio´n")).toBe("conversión");
  });

  it("converts a spacing acute separated by a space", () => {
    expect(normalizeUnicode("conversio ´n")).toBe("conversión");
  });

  it("handles ñ via small tilde, ü via diaeresis, ç via cedilla", () => {
    expect(normalizeUnicode("nin˜o")).toBe("niño");
    expect(normalizeUnicode("u¨")).toBe("ü");
    expect(normalizeUnicode("c¸")).toBe("ç");
  });

  it("leaves ASCII syntax untouched (^ ~ ` are not accents)", () => {
    expect(normalizeUnicode("x^2")).toBe("x^2");
    expect(normalizeUnicode("a~b")).toBe("a~b");
    expect(normalizeUnicode("use `code` here")).toBe("use `code` here");
  });

  it("does not touch code blocks", () => {
    const md = "```\nlet x = o´;\n```";
    expect(normalizeUnicode(md)).toBe(md);
  });

  it("does not invent accents from a standalone diacritic before a letter", () => {
    expect(normalizeUnicode("´ cafe")).toBe("´ cafe");
  });

  it("still maps smart quotes and dashes", () => {
    expect(normalizeUnicode("“hola” – ya")).toBe('"hola" — ya');
  });

  it("is idempotent", () => {
    const once = normalizeUnicode("conversio´n café");
    expect(normalizeUnicode(once)).toBe(once);
  });
});
