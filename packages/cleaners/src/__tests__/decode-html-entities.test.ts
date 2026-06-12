import { describe, it, expect } from "vitest";
import { decodeHtmlEntities } from "../regex/decode-html-entities.js";

describe("decodeHtmlEntities", () => {
  it("decodes &amp; → &", () => {
    expect(decodeHtmlEntities("AT&amp;T")).toBe("AT&T");
  });

  it("decodes &lt; and &gt;", () => {
    expect(decodeHtmlEntities("&lt;b&gt;bold&lt;/b&gt;")).toBe("<b>bold</b>");
  });

  it("decodes &nbsp; → U+00A0", () => {
    const result = decodeHtmlEntities("hello&nbsp;world");
    expect(result.charCodeAt(5)).toBe(0x00a0);
  });

  it("decodes &mdash; → —", () => {
    expect(decodeHtmlEntities("one&mdash;two")).toBe("one—two");
  });

  it("decodes decimal numeric entity &#8212; → —", () => {
    expect(decodeHtmlEntities("one&#8212;two")).toBe("one—two");
  });

  it("decodes hex numeric entity &#x2014; → —", () => {
    expect(decodeHtmlEntities("one&#x2014;two")).toBe("one—two");
  });

  it("decodes &copy; → ©", () => {
    expect(decodeHtmlEntities("&copy; 2024")).toBe("© 2024");
  });

  it("is idempotent", () => {
    const input = "AT&T rocks";
    expect(decodeHtmlEntities(input)).toBe(input);
  });

  it("does NOT double-decode: &amp;amp; → &amp; (not &)", () => {
    expect(decodeHtmlEntities("&amp;amp;")).toBe("&amp;");
  });

  it("preserves unknown entities", () => {
    expect(decodeHtmlEntities("&foobar;")).toBe("&foobar;");
  });

  it("preserves entities inside code blocks", () => {
    const input = "```\n&amp;\n```";
    expect(decodeHtmlEntities(input)).toBe(input);
  });

  it("decodes &euro; → €", () => {
    expect(decodeHtmlEntities("Price: &euro;10")).toBe("Price: €10");
  });
});
