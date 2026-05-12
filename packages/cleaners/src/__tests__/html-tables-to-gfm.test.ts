import { describe, it, expect } from "vitest";
import { htmlTablesToGfm } from "../regex/html-tables-to-gfm.js";

describe("htmlTablesToGfm", () => {
  it("converts a simple <table> with <th> header to GFM", () => {
    const input = `before
<table>
  <tr><th>KPI</th><th>Q2</th><th>Q3</th></tr>
  <tr><td>Conversions</td><td>84,210</td><td>142,580</td></tr>
  <tr><td>Keys</td><td>412</td><td>1,031</td></tr>
</table>
after`;
    const out = htmlTablesToGfm(input);
    expect(out).toMatch(/\| KPI \| Q2 \| Q3 \|/);
    expect(out).toMatch(/\| --- \| --- \| --- \|/);
    expect(out).toMatch(/\| Conversions \| 84,210 \| 142,580 \|/);
    expect(out).toMatch(/\| Keys \| 412 \| 1,031 \|/);
    expect(out).not.toMatch(/<table/i);
  });

  it("uses first row as header when no <th> present", () => {
    const input = `<table><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></table>`;
    const out = htmlTablesToGfm(input);
    expect(out).toMatch(/\| A \| B \|/);
    expect(out).toMatch(/\| --- \| --- \|/);
    expect(out).toMatch(/\| 1 \| 2 \|/);
  });

  it("strips inline tags inside cells and collapses whitespace", () => {
    const input = `<table><tr><th>Name</th></tr><tr><td>  <strong>Foo</strong>\n  Bar  </td></tr></table>`;
    const out = htmlTablesToGfm(input);
    expect(out).toMatch(/\| Foo Bar \|/);
  });

  it("escapes pipe characters inside cells", () => {
    const input = `<table><tr><th>x</th></tr><tr><td>a|b</td></tr></table>`;
    const out = htmlTablesToGfm(input);
    expect(out).toMatch(/\| a\\\|b \|/);
  });

  it("replaces <br> with spaces inside cells", () => {
    const input = `<table><tr><th>x</th></tr><tr><td>line1<br>line2</td></tr></table>`;
    const out = htmlTablesToGfm(input);
    expect(out).toMatch(/\| line1 line2 \|/);
  });

  it("pads short rows to max column count", () => {
    const input = `<table><tr><th>a</th><th>b</th><th>c</th></tr><tr><td>1</td><td>2</td></tr></table>`;
    const out = htmlTablesToGfm(input);
    expect(out).toMatch(/\| 1 \| 2 \|  \|/);
  });

  it("handles attributes on tags", () => {
    const input = `<table class="x" border="1"><tr style="bg"><th align="left">A</th></tr><tr><td colspan="1">1</td></tr></table>`;
    const out = htmlTablesToGfm(input);
    expect(out).toMatch(/\| A \|/);
    expect(out).toMatch(/\| 1 \|/);
  });

  it("is a no-op when no <table> present", () => {
    const input = `# Title\n\n| a | b |\n| - | - |\n| 1 | 2 |\n`;
    expect(htmlTablesToGfm(input)).toBe(input);
  });

  it("converts multiple tables independently", () => {
    const input = `<table><tr><th>A</th></tr><tr><td>1</td></tr></table>\n\n<table><tr><th>B</th></tr><tr><td>2</td></tr></table>`;
    const out = htmlTablesToGfm(input);
    expect(out).toMatch(/\| A \|/);
    expect(out).toMatch(/\| B \|/);
    expect(out).not.toMatch(/<table/i);
  });
});
