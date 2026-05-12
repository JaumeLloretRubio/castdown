/**
 * htmlTablesToGfm — convert HTML `<table>` blocks to GFM pipe tables.
 *
 * MarkItDown emits HTML tables for DOCX/XLSX/PPTX/PDF sources. GFM viewers
 * and downstream Pandoc/Typst templates expect pipe-style tables, so HTML
 * tables silently break the pipeline. Run BEFORE `fixTables` so the rebuilt
 * pipe tables get normalized.
 *
 * Strategy (regex, no DOM):
 *   - Find each `<table …>…</table>` block (case-insensitive, multiline).
 *   - Extract `<tr>` rows; per row extract `<th>`/`<td>` cells.
 *   - First row carrying `<th>` (else first row) → header.
 *   - Inside cells: strip inline tags, collapse whitespace, escape pipes,
 *     map `<br>` to a space.
 *   - rowspan/colspan flattened (GFM has no equivalent). Cells padded to
 *     max column count.
 *
 * Idempotent on already-pipe MD (no `<table>` ⇒ no-op).
 */
export function htmlTablesToGfm(md: string): string {
  const TABLE_RE = /<table\b[^>]*>([\s\S]*?)<\/table\s*>/gi;
  return md.replace(TABLE_RE, (_full, inner: string) => {
    const rows = extractRows(inner);
    if (rows.length === 0) return _full as string;

    const headerIdx = rows.findIndex((r) => r.isHeader);
    const headerRowIdx = headerIdx >= 0 ? headerIdx : 0;
    const header = rows[headerRowIdx]!.cells;
    const body = rows.filter((_, i) => i !== headerRowIdx).map((r) => r.cells);

    const maxCols = Math.max(header.length, ...body.map((r) => r.length), 1);
    const pad = (r: string[]) => {
      const c = [...r];
      while (c.length < maxCols) c.push("");
      return c;
    };

    const lines: string[] = [];
    lines.push(renderRow(pad(header)));
    lines.push(renderRow(Array(maxCols).fill("---")));
    for (const r of body) lines.push(renderRow(pad(r)));
    return "\n" + lines.join("\n") + "\n";
  });
}

interface Row {
  cells: string[];
  isHeader: boolean;
}

function extractRows(inner: string): Row[] {
  const out: Row[] = [];
  const TR_RE = /<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi;
  let m: RegExpExecArray | null;
  while ((m = TR_RE.exec(inner)) !== null) {
    const body = m[1] ?? "";
    const cells: string[] = [];
    let isHeader = false;
    const CELL_RE = /<(th|td)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi;
    let c: RegExpExecArray | null;
    while ((c = CELL_RE.exec(body)) !== null) {
      if ((c[1] ?? "").toLowerCase() === "th") isHeader = true;
      cells.push(cleanCell(c[2] ?? ""));
    }
    if (cells.length > 0) out.push({ cells, isHeader });
  }
  return out;
}

function cleanCell(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[^>]+>/g, "")    // strip remaining inline tags
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\|/g, "\\|");
}

function renderRow(cells: string[]): string {
  return "| " + cells.join(" | ") + " |";
}
