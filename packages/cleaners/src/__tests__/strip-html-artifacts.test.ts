import { describe, it, expect } from "vitest";
import { stripHtmlArtifacts } from "../regex/strip-html-artifacts.js";

describe("stripHtmlArtifacts", () => {
  it("<br> inline → space", () => {
    expect(stripHtmlArtifacts("hello<br>world")).toBe("hello world");
    expect(stripHtmlArtifacts("hello<br/>world")).toBe("hello world");
    expect(stripHtmlArtifacts("hello<br />world")).toBe("hello world");
  });

  it("<br> alone on line → empty line", () => {
    expect(stripHtmlArtifacts("<br>")).toBe("");
    expect(stripHtmlArtifacts("  <br />  ")).toBe("");
  });

  it("<hr> → ---", () => {
    const result = stripHtmlArtifacts("<hr>");
    expect(result).toContain("---");
  });

  it("<b> and <strong> → **bold**", () => {
    expect(stripHtmlArtifacts("<b>bold</b>")).toBe("**bold**");
    expect(stripHtmlArtifacts("<strong>bold</strong>")).toBe("**bold**");
  });

  it("<em> and <i> → _italic_", () => {
    expect(stripHtmlArtifacts("<em>italic</em>")).toBe("_italic_");
    expect(stripHtmlArtifacts("<i>italic</i>")).toBe("_italic_");
  });

  it("<s> and <del> → ~~strikethrough~~", () => {
    expect(stripHtmlArtifacts("<s>text</s>")).toBe("~~text~~");
    expect(stripHtmlArtifacts("<del>text</del>")).toBe("~~text~~");
  });

  it("<sup> preserves inner text", () => {
    expect(stripHtmlArtifacts("word<sup>1</sup>")).toBe("word1");
  });

  it("<span> stripped, content preserved", () => {
    expect(stripHtmlArtifacts("<span class='x'>hello</span>")).toBe("hello");
  });

  it("preserves code blocks unchanged", () => {
    const input = "```\n<b>not bold</b>\n```";
    expect(stripHtmlArtifacts(input)).toBe(input);
  });

  it("unknown tags preserved", () => {
    expect(stripHtmlArtifacts("<custom-elem>text</custom-elem>")).toContain(
      "<custom-elem>",
    );
  });
});
