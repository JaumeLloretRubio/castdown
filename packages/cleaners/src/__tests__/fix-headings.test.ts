import { describe, it, expect } from "vitest";
import { fixHeadings } from "../regex/fix-headings.js";

describe("fixHeadings", () => {
  it("promotes H2 to H1 when no H1 exists", () => {
    const out = fixHeadings("## Title\n\nbody\n\n### Sub");
    expect(out).toMatch(/^# Title/);
    expect(out).toMatch(/^## Sub/m);
  });

  it("leaves H1 alone when present", () => {
    const out = fixHeadings("# Title\n\n## Sub");
    expect(out).toMatch(/^# Title/);
    expect(out).toMatch(/^## Sub/m);
  });

  it("promotes stray ALL-CAPS isolated lines", () => {
    const out = fixHeadings("body\n\nINTRODUCTION\n\nmore body");
    expect(out).toMatch(/## Introduction/);
  });

  it("does not promote lines with lowercase", () => {
    const out = fixHeadings("body\n\nIntroduction Block\n\nmore");
    expect(out).not.toMatch(/##/);
  });
});
