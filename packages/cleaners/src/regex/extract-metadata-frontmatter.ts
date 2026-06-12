import type { CleanOptions } from "../index.js";

const TITLE_RE = /^#[ \t]+(.+)$/m;
const META_LINE_RE =
  /^(?:Title|Título|Author|Authors|Autor|By|Date|Fecha|Published|Updated|Version|Revision):\s*(.+)$/im;
const DATE_LABELS = /^(?:Date|Fecha|Published|Updated):/i;
const AUTHOR_LABELS = /^(?:Author|Authors|Autor|By):/i;
const VERSION_LABELS = /^(?:Version|Revision):/i;

export function extractMetadataFrontmatter(
  md: string,
  opts?: CleanOptions,
): string {
  if (!opts?.extractFrontmatter) return md;
  if (md.startsWith("---\n")) return md;

  const scanLines = opts?.frontmatterScanLines ?? 20;
  const lines = md.split("\n");
  const head = lines.slice(0, scanLines);

  const meta: Record<string, string> = {};

  // Title from first H1
  const h1 = head.join("\n").match(TITLE_RE);
  if (h1) meta["title"] = h1[1]!.trim();

  // Key: value lines
  for (const line of head) {
    const m = line.match(META_LINE_RE);
    if (!m) continue;
    const val = m[1]!.trim();
    if (DATE_LABELS.test(line) && !meta["date"]) meta["date"] = val;
    else if (AUTHOR_LABELS.test(line) && !meta["author"]) meta["author"] = val;
    else if (VERSION_LABELS.test(line) && !meta["version"])
      meta["version"] = val;
  }

  if (Object.keys(meta).length === 0) return md;

  const yaml = Object.entries(meta)
    .map(([k, v]) => `${k}: "${v.replace(/"/g, '\\"')}"`)
    .join("\n");

  return `---\n${yaml}\n---\n\n${md}`;
}
