/**
 * joinBrokenLines — join lines that were broken mid-sentence (PDF column wrap).
 *
 * Rule: if line ends with a lowercase letter or comma AND next line starts
 * with a lowercase letter, treat as single sentence.
 *
 * Conservative: skips lines inside fenced code blocks, lists, tables, headings.
 */
export function joinBrokenLines(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const next = lines[i + 1] ?? "";

    if (/^```/.test(line.trim())) inCode = !inCode;

    if (
      !inCode &&
      out.length > 0 &&
      shouldJoin(out[out.length - 1] ?? "", line)
    ) {
      out[out.length - 1] = (out[out.length - 1] ?? "").replace(/\s+$/, "") + " " + line.trim();
      continue;
    }
    out.push(line);
    void next; // lookahead reserved for future heuristics
  }
  return out.join("\n");
}

function shouldJoin(prev: string, current: string): boolean {
  if (!prev.trim() || !current.trim()) return false;
  if (/^[-*+]\s|^\d+\.\s|^#{1,6}\s|^>\s|^\|/.test(current)) return false; // list/heading/quote/table
  if (/^[-*+]\s|^\d+\.\s|^#{1,6}\s|^>\s|^\|/.test(prev)) return false;
  if (/[.!?:;]$/.test(prev.trim())) return false;
  return /[a-záéíóúñü,]\s*$/.test(prev) && /^[a-záéíóúñü]/.test(current.trim());
}
