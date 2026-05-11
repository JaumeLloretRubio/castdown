/**
 * fixTables — best-effort repair of broken GFM tables.
 *
 * Common parser issues:
 *   - Missing leading/trailing pipes on rows.
 *   - Separator row has too few/many dashes per column.
 *   - Inconsistent column count across rows (pad with empty cells).
 *
 * Strategy: detect runs of contiguous lines that look table-ish
 * (contain `|`), parse into cells, rebuild a clean GFM table.
 */
export function fixTables(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  let inCode = false;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (/^```/.test(line.trim())) inCode = !inCode;

    if (!inCode && looksLikeTable(line)) {
      const start = i;
      while (i < lines.length && looksLikeTable(lines[i] ?? "")) i++;
      const block = lines.slice(start, i);
      out.push(...rebuildTable(block));
      continue;
    }
    out.push(line);
    i++;
  }
  return out.join("\n");
}

function looksLikeTable(line: string): boolean {
  // ≥1 pipe AND not a code fence / blockquote
  return /\|/.test(line) && !/^```/.test(line.trim()) && !/^>/.test(line.trim());
}

function rebuildTable(block: string[]): string[] {
  const rows = block.map(parseRow).filter((r) => r.length > 0);
  if (rows.length < 2) return block; // not enough rows to bother

  // Drop existing separator row if present
  const sepIdx = rows.findIndex((r) => r.every((c) => /^:?-+:?$/.test(c.trim())));
  if (sepIdx >= 0) rows.splice(sepIdx, 1);

  const maxCols = Math.max(...rows.map((r) => r.length));
  const padded = rows.map((r) => {
    const copy = [...r];
    while (copy.length < maxCols) copy.push("");
    return copy;
  });

  const sep = Array(maxCols).fill("---");
  return [renderRow(padded[0]!), renderRow(sep), ...padded.slice(1).map(renderRow)];
}

function parseRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

function renderRow(cells: string[]): string {
  return "| " + cells.join(" | ") + " |";
}
