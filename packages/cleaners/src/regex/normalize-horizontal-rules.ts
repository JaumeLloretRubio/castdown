import { withProtectedCode } from "../util/protect-code.js";

const HR_SIMPLE_RE = /^[ \t]*([-=_*~—–])\1{2,}[ \t]*$/;
const HR_SPACED_RE = /^[ \t]*([-*•—–])(?:[ \t]+\1){2,}[ \t]*$/;

export function normalizeHorizontalRules(md: string): string {
  return withProtectedCode(md, (s) => {
    const lines = s.split("\n");
    return lines
      .map((line, i) => {
        const prev = lines[i - 1] ?? "";
        const isSetextCandidate =
          /^[-=]+$/.test(line) && prev.trim().length > 0;
        if (isSetextCandidate) return line;
        if (HR_SIMPLE_RE.test(line) || HR_SPACED_RE.test(line)) return "---";
        return line;
      })
      .join("\n");
  });
}
