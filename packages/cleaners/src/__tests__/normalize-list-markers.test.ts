import { describe, it, expect } from "vitest";
import { normalizeListMarkers } from "../regex/normalize-list-markers.js";

describe("normalizeListMarkers", () => {
  it("• item → - item", () => {
    expect(normalizeListMarkers("• First item")).toBe("- First item");
  });

  it("◦ item → indented - item (level 1)", () => {
    expect(normalizeListMarkers("◦ Sub item")).toBe("  - Sub item");
  });

  it("► item → - item", () => {
    expect(normalizeListMarkers("► Arrow item")).toBe("- Arrow item");
  });

  it("✓ item → - [x] item", () => {
    expect(normalizeListMarkers("✓ Done task")).toBe("- [x] Done task");
  });

  it("✗ item → - [ ] item", () => {
    expect(normalizeListMarkers("✗ Pending task")).toBe("- [ ] Pending task");
  });

  it("☑ item → - [x] item", () => {
    expect(normalizeListMarkers("☑ Checked")).toBe("- [x] Checked");
  });

  it("preserves existing indentation + adds nesting", () => {
    expect(normalizeListMarkers("  ◦ nested")).toBe("    - nested");
  });

  it("is idempotent on standard MD lists", () => {
    const input = "- normal item\n- another item";
    expect(normalizeListMarkers(input)).toBe(input);
  });

  it("preserves non-bullet lines unchanged", () => {
    const input = "Regular paragraph text.";
    expect(normalizeListMarkers(input)).toBe(input);
  });

  it("preserves code blocks", () => {
    const input = "```\n• bullet in code\n```";
    expect(normalizeListMarkers(input)).toBe(input);
  });
});
