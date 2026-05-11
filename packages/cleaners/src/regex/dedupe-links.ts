/**
 * dedupeLinks — collapse `[text](url) [text](url)` where the same URL appears
 * twice adjacent. Common when PDFs duplicate hyperlink annotations and the
 * parser emits both.
 *
 * Also: empty link text `[](url)` → bare URL.
 */
export function dedupeLinks(md: string): string {
  let out = md;
  // Same link adjacent
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)\s+\[\1\]\(\2\)/g, "[$1]($2)");
  // Empty-text link
  out = out.replace(/\[\s*\]\(([^)]+)\)/g, "<$1>");
  return out;
}
