/**
 * stripPageNumbers — remove lines that are *only* a page marker.
 *
 * Patterns covered:
 *   "12"
 *   "Page 12"
 *   "Page 12 of 340"
 *   "- 12 -"
 *   "[12]"
 */
const PATTERNS = [
  /^\s*\d{1,4}\s*$/gm,
  /^\s*Page\s+\d+(\s+of\s+\d+)?\s*$/gim,
  /^\s*-\s*\d{1,4}\s*-\s*$/gm,
  /^\s*\[\s*\d{1,4}\s*\]\s*$/gm,
];

export function stripPageNumbers(md: string): string {
  let out = md;
  for (const p of PATTERNS) out = out.replace(p, "");
  return out;
}
