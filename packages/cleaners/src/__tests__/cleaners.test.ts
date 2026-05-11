import { describe, it, expect } from "vitest";
import { clean } from "../index.js";
import { stripPageNumbers } from "../regex/strip-page-numbers.js";
import { joinSoftHyphens } from "../regex/join-soft-hyphens.js";
import { collapseBlankLines } from "../regex/collapse-blank-lines.js";
import { stripRepeatedHeaders } from "../regex/strip-repeated-headers.js";

describe("stripPageNumbers", () => {
  it("removes bare numeric lines", () => {
    const out = stripPageNumbers("Title\n\n12\n\nNext paragraph");
    expect(out).not.toMatch(/^\s*12\s*$/m);
  });
  it("removes 'Page N of M'", () => {
    expect(stripPageNumbers("foo\nPage 12 of 340\nbar")).not.toMatch(/Page 12 of 340/);
  });
  it("removes [12] style", () => {
    expect(stripPageNumbers("foo\n[ 7 ]\nbar")).not.toMatch(/\[ 7 \]/);
  });
});

describe("joinSoftHyphens", () => {
  it("joins broken word at line end", () => {
    expect(joinSoftHyphens("exam-\nple")).toBe("example");
  });
  it("preserves real compound hyphens", () => {
    // No newline → no join.
    expect(joinSoftHyphens("co-author")).toBe("co-author");
  });
});

describe("collapseBlankLines", () => {
  it("collapses 5 newlines to single blank line", () => {
    expect(collapseBlankLines("a\n\n\n\n\nb")).toBe("a\n\nb\n");
  });
});

describe("stripRepeatedHeaders", () => {
  it("strips line repeated 4+ times", () => {
    const md = ["Chapter Header", "content one", "Chapter Header", "content two", "Chapter Header", "content three", "Chapter Header", "content four"].join("\n");
    const out = stripRepeatedHeaders(md);
    expect(out).not.toMatch(/Chapter Header/);
  });
  it("preserves lines that occur few times", () => {
    const md = ["Unique Title", "content", "Unique Title", "more"].join("\n");
    const out = stripRepeatedHeaders(md);
    expect(out).toMatch(/Unique Title/);
  });
});

describe("clean pipeline", () => {
  it("returns list of applied passes", async () => {
    const result = await clean("# Title\n\n\n\n\nlorem  ipsum\n\nPage 1 of 4\n");
    expect(result.applied).toContain("collapseBlankLines");
    expect(result.markdown).toMatch(/# Title/);
    expect(result.markdown).not.toMatch(/Page 1 of 4/);
  });
});
