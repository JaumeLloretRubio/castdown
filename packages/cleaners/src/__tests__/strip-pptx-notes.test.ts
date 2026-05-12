import { describe, it, expect } from "vitest";
import { stripPptxNotes } from "../regex/strip-pptx-notes.js";

describe("stripPptxNotes", () => {
  it("strips ## Notes: heading + following text", () => {
    const input = "## Slide content\n\nBullet\n\n## Notes:\n\nSpeaker notes text here.\n\n## Next slide\n\nContent";
    const out = stripPptxNotes(input);
    expect(out).not.toMatch(/Speaker notes text/);
    expect(out).toMatch(/## Next slide/);
    expect(out).toMatch(/## Slide content/);
  });

  it("strips ### Notes: variant", () => {
    const input = "Content\n\n### Notes:\n\nNotes paragraph.\n\n# Next\n\nBody";
    const out = stripPptxNotes(input);
    expect(out).not.toMatch(/Notes paragraph/);
    expect(out).toMatch(/# Next/);
  });

  it("strips **Notes:** bold-paragraph variant", () => {
    const input = "Content\n\n**Notes:**\nThese are the speaker notes.\n\n# Next section";
    const out = stripPptxNotes(input);
    expect(out).not.toMatch(/speaker notes/);
    expect(out).toMatch(/Content/);
  });

  it("strips <!-- notes --> comment marker + text", () => {
    const input = "Content\n\n<!-- notes -->\nNotes content here.\n\n# Next";
    const out = stripPptxNotes(input);
    expect(out).not.toMatch(/Notes content here/);
    expect(out).toMatch(/Content/);
    expect(out).toMatch(/# Next/);
  });

  it("is a no-op on plain markdown without notes sections", () => {
    const plain = "# Title\n\nParagraph.\n\n## Section\n\nMore text.\n";
    expect(stripPptxNotes(plain)).toBe(plain);
  });

  it("strips multiple notes sections across slides", () => {
    const input = [
      "# Slide 1\n\nContent 1",
      "## Notes:\n\nNotes 1.",
      "# Slide 2\n\nContent 2",
      "## Notes:\n\nNotes 2.",
      "# Slide 3\n\nContent 3",
    ].join("\n\n");
    const out = stripPptxNotes(input);
    expect(out).not.toMatch(/Notes 1/);
    expect(out).not.toMatch(/Notes 2/);
    expect(out).toMatch(/Content 1/);
    expect(out).toMatch(/Content 2/);
    expect(out).toMatch(/Content 3/);
  });
});
