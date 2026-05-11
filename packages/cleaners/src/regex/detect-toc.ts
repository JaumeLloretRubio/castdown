/**
 * detectToc — recognize a Table of Contents block and wrap it in a fenced
 * `<!-- toc -->` block, OR strip it entirely if opts.stripToc is true.
 *
 * Pattern signal: 3+ consecutive lines matching `<title> ... <page>` style,
 * e.g. "Chapter 1 .................... 12".
 *
 * By default it's marked, not stripped (consumers can choose to strip).
 */
export interface DetectTocOptions {
  stripToc?: boolean;
}

const TOC_LINE = /^.{3,80}\s*\.{2,}\s*\d{1,4}\s*$/;
const MIN_RUN = 3;

export function detectToc(md: string, opts: DetectTocOptions = {}): string {
  const lines = md.split("\n");
  const ranges: Array<[number, number]> = [];
  let runStart = -1;

  for (let i = 0; i <= lines.length; i++) {
    const line = lines[i] ?? "";
    if (TOC_LINE.test(line.trim())) {
      if (runStart < 0) runStart = i;
    } else if (runStart >= 0) {
      if (i - runStart >= MIN_RUN) ranges.push([runStart, i]);
      runStart = -1;
    }
  }
  if (ranges.length === 0) return md;

  // Apply ranges in reverse so indices stay valid
  const out = lines.slice();
  for (let r = ranges.length - 1; r >= 0; r--) {
    const [s, e] = ranges[r]!;
    if (opts.stripToc) {
      out.splice(s, e - s);
    } else {
      out.splice(s, 0, "<!-- toc:start -->");
      out.splice(e + 1, 0, "<!-- toc:end -->");
    }
  }
  return out.join("\n");
}
