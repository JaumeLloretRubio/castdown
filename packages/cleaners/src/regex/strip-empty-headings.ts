const EMPTY_RE = /^#{1,6}[ \t]*$/gm;
const PUNCT_ONLY_RE =
  /^(#{1,6})[ \t]+(\d+\.[\d.]*|[ivxlcdmIVXLCDM]+\.|[-–—.:;])[ \t]*$/gm;

export function stripEmptyHeadings(md: string): string {
  return md.replace(EMPTY_RE, "").replace(PUNCT_ONLY_RE, "");
}
