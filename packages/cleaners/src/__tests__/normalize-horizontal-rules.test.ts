import { describe, it, expect } from "vitest";
import { normalizeHorizontalRules } from "../regex/normalize-horizontal-rules.js";

describe("normalizeHorizontalRules", () => {
  it("====== → ---", () => {
    expect(normalizeHorizontalRules("======")).toBe("---");
  });

  it("———— → ---", () => {
    expect(normalizeHorizontalRules("————")).toBe("---");
  });

  it("* * * → ---", () => {
    expect(normalizeHorizontalRules("* * *")).toBe("---");
  });

  it("• • • → ---", () => {
    expect(normalizeHorizontalRules("• • •")).toBe("---");
  });

  it("existing --- preserved", () => {
    expect(normalizeHorizontalRules("---")).toBe("---");
  });

  it("setext heading (text + ===) preserved", () => {
    const input = "Title\n===";
    expect(normalizeHorizontalRules(input)).toBe(input);
  });

  it("setext heading (text + ---) preserved", () => {
    const input = "Title\n---";
    expect(normalizeHorizontalRules(input)).toBe(input);
  });

  it("preserves code blocks", () => {
    const input = "```\n======\n```";
    expect(normalizeHorizontalRules(input)).toBe(input);
  });

  it("table cell separator | --- | preserved", () => {
    const input = "| col |\n| --- |";
    expect(normalizeHorizontalRules(input)).toBe(input);
  });
});
