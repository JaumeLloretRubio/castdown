/**
 * collapseBlankLines — three or more blank lines → exactly one blank line.
 * Run last (after other passes may have emptied lines).
 */
export function collapseBlankLines(md: string): string {
  return md.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}
