/**
 * normalizeUnicode — fix misplaced PDF accents + NFC + smart-quote/dash mapping.
 * Idempotent. Run first.
 *
 * PDF text extraction (pdfminer/pdfplumber) emits the accent BEFORE the vowel
 * it belongs to, as either a combining mark ("est"+U+0301+"a") or, more often,
 * a standalone non-ASCII spacing diacritic ("duraci´on", "electr´onicos").
 * Neither composes under plain NFC. We move any such accent forward onto the
 * next letter — but only when that letter has a precomposed accented form, so
 * an accent is never forced onto a consonant — then NFC composes it.
 *
 * Only NON-ASCII spacing diacritics are handled; ASCII look-alikes (^ ~ ` ' ")
 * are Markdown/code syntax and are deliberately left untouched.
 */
import { withProtectedCode } from "../util/protect-code.js";

// Non-ASCII spacing diacritic → its combining counterpart.
const SPACING_TO_COMBINING: Readonly<Record<string, string>> = {
  "´": "́", // ´ acute            → á é í ó ú
  "ˊ": "́", // ˊ modifier acute
  "¨": "̈", // ¨ diaeresis        → ä ë ï ö ü
  "˜": "̃", // ˜ small tilde      → ã ñ õ
  "ˆ": "̂", // ˆ modifier circumflex → â ê î ô û
  "¸": "̧", // ¸ cedilla          → ç
  "ˋ": "̀", // ˋ modifier grave   → à è ì ò ù
};

const SPACING_CHARS = Object.keys(SPACING_TO_COMBINING).join("");
// an accent = a combining mark OR one of the spacing diacritics above
const ACCENT_BEFORE_LETTER = new RegExp(`([̀-ͯ${SPACING_CHARS}])[ \\u00a0]?(\\p{L})`, "gu");

function composesToOne(base: string, mark: string): boolean {
  return (base + mark).normalize("NFC").length === 1;
}

export function normalizeUnicode(md: string): string {
  return withProtectedCode(md, (s) => {
    let out = s.replace(ACCENT_BEFORE_LETTER, (full, acc: string, letter: string) => {
      const mark = SPACING_TO_COMBINING[acc] ?? acc; // spacing → combining; combining stays
      return composesToOne(letter, mark) ? letter + mark : full;
    });

    out = out.normalize("NFC");

    out = out
      .replace(/[‘’‚‛]/g, "'")
      .replace(/[“”„‟]/g, '"')
      .replace(/[–—]/g, "—")
      .replace(/­/g, "") // soft hyphen
      .replace(/ /g, " ") // nbsp → space
      .replace(/​/g, ""); // zero-width space
    return out;
  });
}
