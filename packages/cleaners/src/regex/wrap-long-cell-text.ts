/**
 * wrapLongCellText — insert zero-width spaces (U+200B) at natural break
 * points inside pipe-table cells whose content is a single very long token
 * (no whitespace gaps, ≥ MIN_CHARS characters).
 *
 * Problem: URLs, file paths, and long identifiers in table cells cannot wrap
 * because they contain no space characters. Typst, HTML, and Word renderers
 * have limited support for `word-break: break-all` equivalents. Inserting
 * ZWS at common delimiters gives the renderer explicit break opportunities
 * without changing the visual content.
 *
 * Break points injected after: / . - _ = & ? # , : @ +
 *
 * Conservative by design:
 *   - Only triggers for tokens ≥ MIN_CHARS (default 40).
 *   - Skips cells that are already short or contain natural spaces.
 *   - Skips code-fenced lines.
 *   - Skips separator rows (`| --- |`).
 *   - Idempotent: ZWS are already invisible so re-running is safe.
 *
 * Downstream compatibility:
 *   - Typst: ZWS is a Unicode line-break opportunity (UAX#14 BK rule).
 *   - HTML/EPUB: browsers honour ZWS as a word-break point.
 *   - DOCX: Word respects ZWS.
 *   - LaTeX: pandoc translates ZWS to `\hspace{0pt}` or ignores it — safe.
 */

const ZWS = "​";
const MIN_CHARS = 40;

// Characters that mark a good break point. We insert ZWS AFTER each.
const BREAK_RE = /([/._\-=&?#,:@+])/g;

const isSeparatorRow = (line: string) => /^\s*\|[\s|:-]+\|\s*$/.test(line);
const isPipeRow     = (line: string) => /^\s*\|/.test(line) && !isSeparatorRow(line);

export function wrapLongCellText(md: string): string {
  const lines = md.split("\n");
  let inCode = false;

  return lines.map((line) => {
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      return line;
    }
    if (inCode || !isPipeRow(line)) return line;

    // Split on pipe-delimiters, wrap long tokens, re-join.
    return line
      .split(/(?<!\\)\|/)
      .map((cell, idx) => {
        // Keep leading / trailing pipes as-is (empty strings at boundaries).
        if (!cell.trim()) return cell;
        return wrapCellTokens(cell);
      })
      .join("|");
  }).join("\n");
}

function wrapCellTokens(cell: string): string {
  return cell.replace(/\S+/g, (token) => {
    // ZWS (​) is non-whitespace so \S+ captures already-wrapped tokens.
    // Skip them to stay idempotent.
    if (token.includes(ZWS)) return token;
    if (token.length < MIN_CHARS) return token;
    return token.replace(BREAK_RE, `$1${ZWS}`);
  });
}
