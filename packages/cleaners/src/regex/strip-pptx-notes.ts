/**
 * stripPptxNotes — remove speaker-notes sections from PPTX → MD output.
 *
 * MarkItDown (via python-pptx) appends speaker notes after each slide's
 * content. The typical patterns:
 *
 *   ## Notes:         (heading variant)
 *   <notes text>
 *
 *   **Notes:**        (bold-paragraph variant)
 *   <notes text>
 *
 *   <!-- notes -->    (comment marker MarkItDown occasionally emits)
 *   <notes text>
 *
 * The section is terminated by the next heading or end-of-string.
 * Stripping prevents notes from appearing in rendered output.
 *
 * Idempotent and safe on non-pptx markdown — no match ⇒ no-op.
 */
export function stripPptxNotes(md: string): string {
  let out = md;

  // "## Notes:" or "### Notes:" heading + all following non-heading lines
  // Pattern: match the Notes: heading line, then consume lines until next heading or EOF.
  out = out.replace(/^#{1,4}\s+Notes:?\s*$(?:\n(?!#{1,6}\s)[^\n]*|\n)*\n?/gim, "");

  // "**Notes:**" or "**Notes**:" bold-paragraph variant + following paragraph
  out = out.replace(/^\*\*Notes:?\*\*:?\s*$(?:\n(?!\*\*|#{1,6}\s)[^\n]*|\n)*\n?/gim, "");

  // <!-- notes --> comment marker + following paragraph
  out = out.replace(/^<!--\s*notes?\s*-->$(?:\n(?!<!--|#{1,6}\s)[^\n]*|\n)*\n?/gim, "");

  return out;
}
