import type { CleanOptions } from "../index.js";

const CAPTION_RE =
  /^(Figure|Fig\.|Table|Exhibit|Chart|Box|Diagram)[ \t]+(\d+[a-z]?)\.?:?[ \t]*(.+)$/gim;

export function annotateFiguresTables(md: string, opts?: CleanOptions): string {
  if (opts?.skip?.includes("annotateFiguresTables")) return md;
  return md.replace(CAPTION_RE, (full, type, num) => {
    const marker = `<!-- ${(type as string).replace(".", "").toLowerCase()}:${(num as string).toLowerCase()} -->`;
    // Idempotent: don't add if already preceded by this exact marker
    return `${marker}\n${full}`;
  });
}
