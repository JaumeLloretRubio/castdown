import { describe, it, expect } from "vitest";
import { collapseRedundantEmphasis } from "../regex/collapse-redundant-emphasis.js";

describe("collapseRedundantEmphasis", () => {
  it("**a** **b** → **a b**", () => {
    expect(collapseRedundantEmphasis("**word1** **word2**")).toBe("**word1 word2**");
  });

  it("_a_ _b_ → _a b_", () => {
    expect(collapseRedundantEmphasis("_word1_ _word2_")).toBe("_word1 word2_");
  });

  it("~~a~~ ~~b~~ → ~~a b~~", () => {
    expect(collapseRedundantEmphasis("~~text1~~ ~~text2~~")).toBe("~~text1 text2~~");
  });

  it("collapses 3+ adjacent spans across multiple passes", () => {
    const result = collapseRedundantEmphasis("**a** **b** **c**");
    expect(result).toBe("**a b c**");
  });

  it("does NOT collapse different emphasis types", () => {
    const input = "**bold** _italic_";
    expect(collapseRedundantEmphasis(input)).toBe(input);
  });

  it("is idempotent on normal text", () => {
    const input = "Normal **bold** text";
    expect(collapseRedundantEmphasis(input)).toBe(input);
  });

  it("does not affect links [a](b) [c](d)", () => {
    const input = "[link1](http://a.com) [link2](http://b.com)";
    expect(collapseRedundantEmphasis(input)).toBe(input);
  });

  it("preserves code blocks", () => {
    const input = "```\n**a** **b**\n```";
    expect(collapseRedundantEmphasis(input)).toBe(input);
  });
});
