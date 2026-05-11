import { describe, it, expect } from "vitest";
import { detectToc } from "../regex/detect-toc.js";

const TOC = [
  "Chapter 1 ............. 1",
  "Chapter 2 ............. 12",
  "Chapter 3 ............. 24",
  "Chapter 4 ............. 36",
].join("\n");

describe("detectToc", () => {
  it("wraps detected TOC by default", () => {
    const out = detectToc(`Intro\n\n${TOC}\n\nBody`);
    expect(out).toMatch(/<!-- toc:start -->/);
    expect(out).toMatch(/<!-- toc:end -->/);
  });

  it("strips TOC when stripToc=true", () => {
    const out = detectToc(`Intro\n\n${TOC}\n\nBody`, { stripToc: true });
    expect(out).not.toMatch(/Chapter \d/);
  });

  it("ignores short runs", () => {
    const short = "Chapter 1 ............. 1\nChapter 2 ............. 12";
    expect(detectToc(short)).toBe(short);
  });
});
