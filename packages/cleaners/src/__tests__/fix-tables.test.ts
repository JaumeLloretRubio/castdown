import { describe, it, expect } from "vitest";
import { fixTables } from "../regex/fix-tables.js";

describe("fixTables", () => {
  it("adds missing leading/trailing pipes", () => {
    const input = "a | b | c\n--- | --- | ---\n1 | 2 | 3";
    const out = fixTables(input);
    expect(out).toMatch(/^\| a \| b \| c \|/m);
    expect(out).toMatch(/^\| 1 \| 2 \| 3 \|/m);
  });

  it("pads short rows to max column count", () => {
    const input = "| a | b | c |\n| --- | --- | --- |\n| 1 | 2 |";
    const out = fixTables(input);
    expect(out).toMatch(/\| 1 \| 2 \|\s*\|/);
  });

  it("leaves non-table content alone", () => {
    const input = "# Title\n\nNo tables here.\n";
    expect(fixTables(input)).toBe(input);
  });

  it("preserves code blocks containing pipes", () => {
    const input = "```\necho a | b\n```";
    expect(fixTables(input)).toBe(input);
  });
});
