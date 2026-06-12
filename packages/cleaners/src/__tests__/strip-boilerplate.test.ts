import { describe, it, expect } from "vitest";
import { stripBoilerplate } from "../regex/strip-boilerplate.js";

describe("stripBoilerplate", () => {
  it("removes © 2026 copyright line", () => {
    const input = "© 2026 Acme Corp. All rights reserved.";
    const result = stripBoilerplate(input);
    expect(result).not.toContain("© 2026");
  });

  it("removes 'All rights reserved.' line", () => {
    const input = "All rights reserved.";
    expect(stripBoilerplate(input).trim()).toBe("");
  });

  it("removes 'CONFIDENTIAL' line", () => {
    const input = "CONFIDENTIAL";
    expect(stripBoilerplate(input).trim()).toBe("");
  });

  it("removes 'PROPRIETARY' line", () => {
    const input = "PROPRIETARY";
    expect(stripBoilerplate(input).trim()).toBe("");
  });

  it("keepBoilerplate: true → preserves everything", () => {
    const input = "© 2026 Corp\nAll rights reserved.";
    expect(stripBoilerplate(input, { keepBoilerplate: true })).toBe(input);
  });

  it("is idempotent on clean content", () => {
    const input = "# Title\n\nSome content here.";
    expect(stripBoilerplate(input)).toBe(input);
  });

  it("does NOT remove 'copyright' mid-sentence", () => {
    const input = "This discusses copyright law in detail.";
    expect(stripBoilerplate(input)).toBe(input);
  });
});
