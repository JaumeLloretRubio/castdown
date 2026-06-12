import { withProtectedCode } from "../util/protect-code.js";

const SAFE_TAGS =
  /^\/?(p|section|article|header|footer|main|figure|figcaption|caption|mark|abbr|cite|q|ins|u)$/i;

export function stripHtmlArtifacts(md: string): string {
  return withProtectedCode(md, (s) => {
    let out = s;
    out = out.replace(/^[ \t]*<br\s*\/?>[ \t]*$/gim, "");
    out = out.replace(/<br\s*\/?>/gi, " ");
    out = out.replace(/^[ \t]*<hr\s*\/?>[ \t]*$/gim, "\n---\n");
    out = out.replace(/<strong\b[^>]*>([\s\S]*?)<\/strong>/gi, "**$1**");
    out = out.replace(/<b\b[^>]*>([\s\S]*?)<\/b>/gi, "**$1**");
    out = out.replace(/<em\b[^>]*>([\s\S]*?)<\/em>/gi, "_$1_");
    out = out.replace(/<i\b[^>]*>([\s\S]*?)<\/i>/gi, "_$1_");
    out = out.replace(/<s\b[^>]*>([\s\S]*?)<\/s>/gi, "~~$1~~");
    out = out.replace(/<del\b[^>]*>([\s\S]*?)<\/del>/gi, "~~$1~~");
    out = out.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, "`$1`");
    out = out.replace(/<sup\b[^>]*>([\s\S]*?)<\/sup>/gi, "$1");
    out = out.replace(/<sub\b[^>]*>([\s\S]*?)<\/sub>/gi, "$1");
    out = out.replace(/<div\b[^>]*>([\s\S]*?)<\/div>/gi, "$1");
    out = out.replace(/<span\b[^>]*>([\s\S]*?)<\/span>/gi, "$1");
    out = out.replace(
      /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g,
      (full, slash, tag) => (SAFE_TAGS.test(`${slash}${tag}`) ? "" : full),
    );
    return out;
  });
}
