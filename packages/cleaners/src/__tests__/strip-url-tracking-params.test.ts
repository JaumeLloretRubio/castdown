import { describe, it, expect } from "vitest";
import { stripUrlTrackingParams } from "../regex/strip-url-tracking-params.js";

describe("stripUrlTrackingParams", () => {
  it("removes utm_source", () => {
    const input = "[page](https://example.com?utm_source=newsletter)";
    expect(stripUrlTrackingParams(input)).toBe("[page](https://example.com/)");
  });

  it("removes utm_campaign", () => {
    const input = "[page](https://example.com/?utm_campaign=spring)";
    expect(stripUrlTrackingParams(input)).toBe("[page](https://example.com/)");
  });

  it("removes fbclid", () => {
    const input = "[page](https://example.com/?fbclid=abc123)";
    expect(stripUrlTrackingParams(input)).toBe("[page](https://example.com/)");
  });

  it("removes multiple tracking params", () => {
    const input =
      "[page](https://example.com/?utm_source=a&utm_medium=b&q=search)";
    expect(stripUrlTrackingParams(input)).toBe(
      "[page](https://example.com/?q=search)",
    );
  });

  it("preserves legitimate params (id, q)", () => {
    const input = "[page](https://example.com/?q=search&id=42)";
    expect(stripUrlTrackingParams(input)).toBe(input);
  });

  it("preserves invalid/relative URLs unchanged", () => {
    const input = "[page](/relative/path?utm_source=x)";
    expect(stripUrlTrackingParams(input)).toBe(input);
  });

  it("is idempotent on clean URLs", () => {
    const input = "[page](https://example.com/)";
    expect(stripUrlTrackingParams(input)).toBe(input);
  });

  it("removes _ga tracking param", () => {
    const input = "[x](https://example.com/?_ga=2.123456789)";
    expect(stripUrlTrackingParams(input)).toBe("[x](https://example.com/)");
  });
});
