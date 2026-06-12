import { withProtectedCode } from "../util/protect-code.js";

const BULLET_LEVEL: Record<string, number> = {
  "•": 0, "▪": 0, "▶": 0, "►": 0, "◆": 0, "❖": 0, "→": 0, "»": 0,
  "◦": 1, "▫": 1, "▷": 1, "▸": 1, "◇": 1, "○": 1,
  "‣": 2, "·": 2,
};

const CHECK_TRUE_CHARS = new Set(["✓", "✔", "☑"]);
const CHECK_FALSE_CHARS = new Set(["✗", "✘", "☐"]);

const ALL_BULLET_CHARS = [
  ...Object.keys(BULLET_LEVEL),
  ...CHECK_TRUE_CHARS,
  ...CHECK_FALSE_CHARS,
].join("");

const BULLET_LINE_RE = new RegExp(
  `^([ \\t]*)([${ALL_BULLET_CHARS}])\\s+(.+)$`,
);

export function normalizeListMarkers(md: string): string {
  return withProtectedCode(md, (s) => {
    const lines = s.split("\n");
    return lines
      .map((line) => {
        const m = line.match(BULLET_LINE_RE);
        if (!m) return line;
        const [, indent, sym, content] = m as [string, string, string, string];
        if (CHECK_TRUE_CHARS.has(sym)) return `${indent}- [x] ${content}`;
        if (CHECK_FALSE_CHARS.has(sym)) return `${indent}- [ ] ${content}`;
        const level = BULLET_LEVEL[sym] ?? 0;
        const extra = "  ".repeat(level);
        return `${indent}${extra}- ${content}`;
      })
      .join("\n");
  });
}
