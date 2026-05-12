import { describe, it, expect } from "vitest";
import { wrapLongCellText } from "../regex/wrap-long-cell-text.js";

const ZWS = "​";

describe("wrapLongCellText", () => {
  it("inserts ZWS after / in long URLs inside table cells", () => {
    const url = "https://api.example.com/v2/users/profile/settings/export";
    const input = `| Campo | Valor |\n| --- | --- |\n| Endpoint | ${url} |`;
    const out = wrapLongCellText(input);
    // URL should have ZWS after slashes
    expect(out).toContain(`/${ZWS}`);
    // Full URL content still present (ZWS is invisible)
    expect(out.replace(new RegExp(ZWS, "g"), "")).toContain(url);
  });

  it("inserts ZWS after . in long dotted identifiers", () => {
    const token = "com.example.application.module.service.processor.handler";
    const input = `| ID | ${token} |\n| --- | --- |`;
    const out = wrapLongCellText(input);
    expect(out).toContain(`.${ZWS}`);
    expect(out.replace(new RegExp(ZWS, "g"), "")).toContain(token);
  });

  it("inserts ZWS after _ in long snake_case identifiers", () => {
    const token = "very_long_snake_case_identifier_that_wont_wrap_naturally_in_pdf";
    const input = `| Key | ${token} |\n| --- | --- |`;
    const out = wrapLongCellText(input);
    expect(out).toContain(`_${ZWS}`);
  });

  it("does NOT insert ZWS in short cells (< 40 chars)", () => {
    const input = "| Header | Value |\n| --- | --- |\n| Short | normal text here |";
    const out = wrapLongCellText(input);
    expect(out).not.toContain(ZWS);
  });

  it("does NOT modify non-table lines", () => {
    const input = "# Title\n\nSome paragraph with https://verylongurl.example.com/path/to/resource/that/is/long";
    expect(wrapLongCellText(input)).toBe(input);
  });

  it("skips separator rows", () => {
    const input = "| a | b |\n| --- | --- |\n| c | d |";
    const out = wrapLongCellText(input);
    expect(out).toContain("| --- | --- |");
  });

  it("skips lines inside code fences", () => {
    const url = "https://api.example.com/very/long/path/to/resource/that/needs/wrapping";
    const input = `\`\`\`\n| ${url} |\n\`\`\``;
    expect(wrapLongCellText(input)).toBe(input);
  });

  it("is idempotent", () => {
    const url = "https://api.example.com/v2/users/profile/settings/export/data";
    const input = `| Endpoint | ${url} |\n| --- | --- |`;
    const once = wrapLongCellText(input);
    const twice = wrapLongCellText(once);
    // Running twice should not add extra ZWS (they're already present)
    expect(twice.split(ZWS).length).toBe(once.split(ZWS).length);
  });

  it("preserves the full text content modulo ZWS", () => {
    const url = "https://cdn.example.com/assets/images/banner_2026_full_resolution.png";
    const input = `| Image | ${url} |\n| --- | --- |`;
    const out = wrapLongCellText(input);
    expect(out.replace(new RegExp(ZWS, "g"), "")).toBe(input);
  });
});
