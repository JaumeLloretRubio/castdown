/**
 * stripDocxArtifacts — remove pandoc DOCX-conversion leftovers.
 *
 * When pandoc converts .docx → markdown it emits span attributes for
 * formatting that has no GFM equivalent: `[text]{.underline}`,
 * `[text]{.smallcaps}`, `[text]{.mark}`, `[text]{.highlight}`.
 * These pass through remark unchanged and end up in final output as
 * literal punctuation noise.
 *
 * Also handles:
 * - `[text]{.strikethrough}` → `~~text~~` (GFM has this)
 * - `&nbsp;`  → regular space
 * - `\\ ` (pandoc hard line-break) → single space at end-of-line
 * - `<!-- {.XXX} -->` comment-style span leftovers
 *
 * Safe on non-docx input — zero matches on plain markdown.
 */
export function stripDocxArtifacts(md: string): string {
  let out = md;

  // [text]{.strikethrough} → ~~text~~ (semantic preservation)
  out = out.replace(/\[([^\]]+)\]\{\.strikethrough\}/g, "~~$1~~");

  // [text]{.class} spans with no GFM equivalent → bare text
  out = out.replace(/\[([^\]]+)\]\{\.(?:underline|smallcaps|mark|highlight|subscript|superscript)\}/g, "$1");

  // Generic span with only ignored attribute(s): [text]{.anything}
  // More conservative: only strip if the entire attribute block has no
  // semantic meaning we want to keep (no # id, no key=val other than class).
  out = out.replace(/\[([^\]]+)\]\{(?:\.[a-z][a-z0-9-]*\s*)+\}/g, "$1");

  // Pandoc hard line-break: trailing "\ " before newline
  out = out.replace(/\\ $/gm, "");

  // &nbsp; → regular space (common in copy-pasted DOCX content)
  out = out.replace(/&nbsp;/g, " ");

  // <!-- {.someclass} --> inline comments from div-fence conversion
  out = out.replace(/<!--\s*\{[^}]+\}\s*-->/g, "");

  return out;
}
