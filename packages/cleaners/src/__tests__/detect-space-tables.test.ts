import { describe, it, expect } from "vitest";
import { detectSpaceTables } from "../regex/detect-space-tables.js";

describe("detectSpaceTables", () => {
  it("converts a 3-column whitespace-aligned block to GFM", () => {
    const input = [
      "Intro paragraph.",
      "",
      "KPI          Q2       Q3",
      "Conversions  84,210   142,580",
      "Keys         412      1,031",
      "",
      "Outro.",
    ].join("\n");
    const out = detectSpaceTables(input);
    expect(out).toMatch(/\| KPI \| Q2 \| Q3 \|/);
    expect(out).toMatch(/\| --- \| --- \| --- \|/);
    expect(out).toMatch(/\| Conversions \| 84,210 \| 142,580 \|/);
    expect(out).toMatch(/\| Keys \| 412 \| 1,031 \|/);
  });

  it("leaves prose alone (no false positives on regular paragraphs)", () => {
    const input = "Lorem ipsum dolor sit amet.\nConsectetur adipiscing elit.\nSed do eiusmod tempor.";
    expect(detectSpaceTables(input)).toBe(input);
  });

  it("ignores blocks with fewer than 3 rows", () => {
    const input = "Header A   Header B\nRow 1     Row 2";
    expect(detectSpaceTables(input)).toBe(input);
  });

  it("does not convert single-column gap-less lists", () => {
    const input = "alpha\nbeta\ngamma\ndelta";
    expect(detectSpaceTables(input)).toBe(input);
  });

  it("skips lines inside fenced code blocks", () => {
    const input = [
      "```",
      "name   age   city",
      "alice  30    nyc",
      "bob    25    sf",
      "carol  40    la",
      "```",
    ].join("\n");
    expect(detectSpaceTables(input)).toBe(input);
  });

  it("skips bullet lists and headings", () => {
    const input = [
      "- item one    extra",
      "- item two    extra",
      "- item three  extra",
    ].join("\n");
    expect(detectSpaceTables(input)).toBe(input);
  });

  it("requires consistent column count across rows", () => {
    const input = [
      "a   b   c",
      "1   2   3",
      "x   y", // mismatched
    ].join("\n");
    // shouldn't render as a table since rows disagree
    expect(detectSpaceTables(input)).toBe(input);
  });

  it("rejects all-numeric short-cell blocks (filters noise)", () => {
    const input = [
      "1  2  3",
      "4  5  6",
      "7  8  9",
    ].join("\n");
    expect(detectSpaceTables(input)).toBe(input);
  });

  it("preserves surrounding content order", () => {
    const input = [
      "Before paragraph.",
      "",
      "Name        Score   Notes",
      "Alice       95      excellent",
      "Bob         82      good",
      "Carol       76      ok",
      "",
      "After paragraph.",
    ].join("\n");
    const out = detectSpaceTables(input);
    expect(out).toMatch(/Before paragraph\./);
    expect(out).toMatch(/After paragraph\./);
    expect(out).toMatch(/\| Name \| Score \| Notes \|/);
  });
});
