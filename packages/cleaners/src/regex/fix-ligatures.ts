import { withProtectedCode } from "../util/protect-code.js";
import type { CleanOptions } from "../index.js";

const LIGATURE_MAP: Readonly<Record<string, string>> = {
  "ﬀ": "ff",
  "ﬁ": "fi",
  "ﬂ": "fl",
  "ﬃ": "ffi",
  "ﬄ": "ffl",
  "ﬅ": "st",
  "ﬆ": "st",
};

const LIGATURE_RE = new RegExp(`[ﬀ-ﬆ]`, "g");

export function fixLigatures(md: string, opts?: CleanOptions): string {
  const map: Record<string, string> = { ...LIGATURE_MAP, ...(opts?.ligatureMap ?? {}) };
  return withProtectedCode(md, (s) =>
    s.replace(LIGATURE_RE, (ch) => map[ch] ?? ch),
  );
}
