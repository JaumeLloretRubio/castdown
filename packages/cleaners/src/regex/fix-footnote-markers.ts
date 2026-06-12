import { withProtectedCode } from "../util/protect-code.js";

const SUPER_MAP: Record<string, string> = {
  "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5",
  "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁰": "0",
};

const SUPER_CHARS = Object.keys(SUPER_MAP).join("");
const SUPER_RE = new RegExp(`[${SUPER_CHARS}]+`, "g");

function toDigits(sup: string): string {
  return sup
    .split("")
    .map((c) => SUPER_MAP[c] ?? c)
    .join("");
}

export function fixFootnoteMarkers(md: string): string {
  return withProtectedCode(md, (s) => {
    // Inline: word¹ → word[^1]  (only when superscript directly follows a word char)
    let out = s.replace(
      new RegExp(`(\\w)([${SUPER_CHARS}]+)`, "g"),
      (_, w, sup) => `${w as string}[^${toDigits(sup as string)}]`,
    );

    // Standalone footnote definitions at line start: ¹ Text → [^1]: Text
    out = out.replace(
      new RegExp(`^([${SUPER_CHARS}]+)[ \\t]+(.+)$`, "gm"),
      (_, sup, text) => `[^${toDigits(sup as string)}]: ${text as string}`,
    );

    return out;
  });
}
