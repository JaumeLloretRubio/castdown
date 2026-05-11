/**
 * stripRepeatedHeaders — remove lines repeated across many pages.
 *
 * Heuristic: any line ≥ 8 chars that appears ≥ 4 times across the doc
 * is likely a running header/footer (e.g., "Chapter 3 — Foundations").
 *
 * Avoids stripping real content by requiring multiple occurrences AND
 * that the line is short enough to be a header (≤ 120 chars).
 */
const MIN_OCCURRENCES = 4;
const MIN_LEN = 8;
const MAX_LEN = 120;

export function stripRepeatedHeaders(md: string): string {
  const lines = md.split("\n");
  const counts = new Map<string, number>();
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length < MIN_LEN || line.length > MAX_LEN) continue;
    if (/^#{1,6}\s/.test(line)) continue; // real headings
    if (/^[-*+]\s/.test(line)) continue; // lists
    if (/^>\s/.test(line)) continue; // quotes
    counts.set(line, (counts.get(line) ?? 0) + 1);
  }

  const toStrip = new Set<string>();
  for (const [line, n] of counts) {
    if (n >= MIN_OCCURRENCES) toStrip.add(line);
  }
  if (toStrip.size === 0) return md;

  return lines.filter((raw) => !toStrip.has(raw.trim())).join("\n");
}
