import { withProtectedCode } from "../util/protect-code.js";

export function normalizeWhitespaceInLines(md: string): string {
  return withProtectedCode(md, (s) => {
    const lines = s.split("\n");
    return lines
      .map((line) => {
        // Whitespace-only line → empty
        if (/^\s+$/.test(line)) return "";
        // Preserve double-space hard line break at end (exactly 2 trailing spaces)
        if (/[^ \t]  $/.test(line)) return line;
        // Strip trailing whitespace
        line = line.trimEnd();
        // Collapse multiple internal spaces (skip code-indented lines)
        if (!/^(?:    |\t)/.test(line)) {
          line = line.replace(/([^\s])[ \t]{2,}([^\s])/g, "$1 $2");
        }
        return line;
      })
      .join("\n");
  });
}
