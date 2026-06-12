/**
 * normalizeUnicode — fix misplaced PDF accents + NFC + smart-quote/dash mapping.
 * Idempotent. Run first.
 *
 * pdfminer/pdfplumber emit combining accents ONE base-character too early —
 * before the vowel they belong to: "está" comes out as "est"+U+0301+"a",
 * "duración" as "duraci"+U+0301+"on". Plain NFC can't fix this because the
 * mark is adjacent to the wrong letter. We move each combining mark onto the
 * FOLLOWING letter, but only when that letter can actually carry the accent
 * (so we never push an accent onto a consonant), then NFC composes it.
 *
 * Assumption (holds for pdfminer output): correctly-accented characters arrive
 * pre-composed, so any *combining* mark present is a misplaced artifact.
 */
import { withProtectedCode } from "../util/protect-code.js";

// base letter + combining mark(s) + next base letter
const MISPLACED_RE = /(\p{L})([̀-ͯ]+)(\p{L})/gu;

function composesToOne(base: string, marks: string): boolean {
  return (base + marks).normalize("NFC").length === 1;
}

export function normalizeUnicode(md: string): string {
  return withProtectedCode(md, (s) => {
    let out = s.replace(MISPLACED_RE, (full, b1: string, marks: string, b2: string) =>
      composesToOne(b2, marks) ? b1 + b2 + marks : full,
    );

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
