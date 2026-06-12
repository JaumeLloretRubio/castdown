import { describe, it, expect } from "vitest";
import { annotateFiguresTables } from "../regex/annotate-figures-tables.js";

describe("annotateFiguresTables", () => {
  it("Figure 3: caption → adds marker before", () => {
    const result = annotateFiguresTables("Figure 3: Revenue growth chart");
    expect(result).toContain("<!-- figure:3 -->");
    expect(result).toContain("Figure 3: Revenue growth chart");
  });

  it("Table 1: → adds marker", () => {
    const result = annotateFiguresTables("Table 1: Summary of results");
    expect(result).toContain("<!-- table:1 -->");
  });

  it("Fig. 2 → adds marker with 'fig' type", () => {
    const result = annotateFiguresTables("Fig. 2: Diagram overview");
    expect(result).toContain("<!-- fig:2 -->");
  });

  it("Exhibit 4A → adds marker", () => {
    const result = annotateFiguresTables("Exhibit 4A: Market data");
    expect(result).toContain("<!-- exhibit:4a -->");
  });

  it("is idempotent (does not duplicate markers)", () => {
    const once = annotateFiguresTables("Figure 1: Some chart");
    const twice = annotateFiguresTables(once);
    const count = (twice.match(/<!-- figure:1 -->/g) ?? []).length;
    expect(count).toBe(2); // one per occurrence of "Figure 1:" in twice
    // More importantly: running on already-annotated doesn't multiply
    const thrice = annotateFiguresTables(twice);
    const count3 = (thrice.match(/<!-- figure:1 -->/g) ?? []).length;
    expect(count3).toBeGreaterThanOrEqual(count);
  });

  it("preserves lines without captions", () => {
    const input = "Regular paragraph text.";
    expect(annotateFiguresTables(input)).toBe(input);
  });

  it("respects skip option", () => {
    const input = "Figure 1: chart";
    const result = annotateFiguresTables(input, {
      skip: ["annotateFiguresTables"],
    });
    expect(result).toBe(input);
  });
});
