/**
 * normalizeUnicode — recompose split accents + NFC + smart-quote/dash mapping.
 * Idempotent. Run first.
 *
 * PDF text extraction (pdfminer/pdfplumber) frequently emits an accent as a
 * SEPARATE character from its base letter — either a combining mark detached
 * by whitespace ("o" + U+0301) or a non-ASCII spacing diacritic glyph
 * ("o" + U+00B4 "´"). Plain NFC can't fix these (the pieces aren't an adjacent
 * base+combining pair), so we reattach them first, then NFC composes "ó".
 *
 * Only NON-ASCII spacing diacritics are remapped. ASCII look-alikes (^ ~ ` ' ")
 * are Markdown/code syntax and are deliberately left untouched.
 */
import { withProtectedCode } from "../util/protect-code.js";

const COMBINING = "\\u0300-\\u036f";
const SEP = "[ \\t\\u00a0\\u200b]*"; // optional whitespace/nbsp/zwsp between base and accent

// Non-ASCII spacing diacritic → combining equivalent (escapes only, no literals).
const SPACING_TO_COMBINING: Readonly<Record<string, string>> = {
  "´": "́", // ´ acute               → á é í ó ú
  "ˊ": "́", // ˊ modifier acute
  "¨": "̈", // ¨ diaeresis           → ä ë ï ö ü
  "˜": "̃", // ˜ small tilde         → ã ñ õ
  "ˆ": "̂", // ˆ modifier circumflex → â ê î ô û
  "¸": "̧", // ¸ cedilla             → ç
  "ˋ": "̀", // ˋ modifier grave      → à è ì ò ù
};

const SPACING_CHARS = Object.keys(SPACING_TO_COMBINING).join("");

// base letter + optional gap + detached combining mark
const SPLIT_COMBINING_RE = new RegExp(`(\\p{L})${SEP}([${COMBINING}])`, "gu");
// base letter + optional gap + non-ASCII spacing diacritic (accent after letter)
const SPACING_AFTER_RE = new RegExp(`(\\p{L})${SEP}([${SPACING_CHARS}])`, "gu");

export function normalizeUnicode(md: string): string {
  return withProtectedCode(md, (s) => {
    let out = s
      // 1. reattach detached combining marks
      .replace(SPLIT_COMBINING_RE, "$1$2")
      // 2. spacing diacritic after a letter → combining equivalent
      .replace(SPACING_AFTER_RE, (_m, base: string, acc: string) => base + SPACING_TO_COMBINING[acc]);

    // 3. canonical compose (now base+combining are adjacent)
    out = out.normalize("NFC");

    // 4. cosmetic normalization
    out = out
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[“”„‟]/g, '"')
      .replace(/[–—]/g, "—")
      .replace(/­/g, "") // soft hyphen
      .replace(/ /g, " ") // nbsp → space
      .replace(/​/g, ""); // zero-width space
    return out;
  });
}
