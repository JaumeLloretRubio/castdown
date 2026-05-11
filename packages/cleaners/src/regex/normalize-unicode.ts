/**
 * normalizeUnicode — NFC normalization + smart-quote/dash mapping.
 * Idempotent. Run first.
 */
export function normalizeUnicode(md: string): string {
  let out = md.normalize("NFC");
  out = out
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—]/g, "—")
    .replace(/­/g, "") // soft hyphen
    .replace(/ /g, " ") // nbsp → space
    .replace(/​/g, ""); // zero-width space
  return out;
}
