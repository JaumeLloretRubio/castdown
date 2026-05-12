/**
 * detectSpaceTables — recover tables that PDF/pdfminer outputs as
 * whitespace-aligned text (no `|`, no `<table>`).
 *
 * pdfminer (and therefore MarkItDown on PDF) has no notion of table cells;
 * it just emits text positioned by spaces. A block like:
 *
 *     KPI          Q2       Q3
 *     Conversions  84,210   142,580
 *     Keys         412      1,031
 *
 * survives the earlier cleaners untouched and renders as a wall of text.
 *
 * Heuristic (conservative — false positives on code/ASCII art are worse
 * than a missed conversion):
 *   - Walk runs of ≥3 contiguous non-blank lines that are NOT inside a
 *     fenced code block, NOT already pipe-tables, NOT list/heading/quote.
 *   - Split each line on `/\s{2,}/`. Require ≥2 columns and identical
 *     column count across the whole run.
 *   - Require ≥1 column to be a multi-word "label" cell (avg cell length
 *     ≥ 3 chars) to avoid converting space-separated number columns
 *     that are really paragraphs of digits.
 *   - First row → header.
 *
 * Idempotent: pipe tables already produced by earlier passes are skipped
 * because their lines start with `|`.
 */
export function detectSpaceTables(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      out.push(line);
      i++;
      continue;
    }
    if (inCode || !isCandidate(line)) {
      out.push(line);
      i++;
      continue;
    }

    // Probe contiguous candidate lines with identical column count.
    const cells0 = splitCols(line);
    if (cells0.length < 2) {
      out.push(line);
      i++;
      continue;
    }
    const cols = cells0.length;
    const block: string[][] = [cells0];
    let j = i + 1;
    while (j < lines.length) {
      const lj = lines[j] ?? "";
      if (!isCandidate(lj)) break;
      const c = splitCols(lj);
      if (c.length !== cols) break;
      block.push(c);
      j++;
    }

    if (block.length >= 3 && looksTabular(block)) {
      out.push(...renderGfm(block));
      i = j;
      continue;
    }

    out.push(line);
    i++;
  }

  return out.join("\n");
}

function isCandidate(line: string): boolean {
  if (!line.trim()) return false;
  // skip lines that are clearly something else
  if (/^\s*\|/.test(line)) return false;            // already a pipe table
  if (/^\s*[#>]/.test(line)) return false;          // heading / quote
  if (/^\s*[-*+]\s/.test(line)) return false;       // bullet list
  if (/^\s*\d+\.\s/.test(line)) return false;       // ordered list
  if (/^\s{4,}\S/.test(line)) return false;         // indented code
  return /\S\s{2,}\S/.test(line);                   // ≥1 multi-space gap
}

function splitCols(line: string): string[] {
  return line.trim().split(/\s{2,}/).map((s) => s.trim()).filter((s) => s.length > 0);
}

function looksTabular(block: string[][]): boolean {
  const cols = block[0]!.length;
  // At least one column must average ≥ 3 chars across rows — filters
  // out runs of pure-numeric or single-char columns that are usually
  // not tables.
  for (let c = 0; c < cols; c++) {
    let sum = 0;
    for (const row of block) sum += (row[c] ?? "").length;
    if (sum / block.length >= 3) return true;
  }
  return false;
}

function renderGfm(block: string[][]): string[] {
  const cols = block[0]!.length;
  const header = block[0]!;
  const body = block.slice(1);
  const sep = Array(cols).fill("---");
  return [
    "",
    renderRow(header),
    renderRow(sep),
    ...body.map(renderRow),
    "",
  ];
}

function renderRow(cells: string[]): string {
  return "| " + cells.map((c) => c.replace(/\|/g, "\\|")).join(" | ") + " |";
}
