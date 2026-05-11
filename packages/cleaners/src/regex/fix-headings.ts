/**
 * fixHeadings — repair heading levels coming out of PDF/DOCX parsers.
 *
 * Common issues:
 *   - Inconsistent shifting: doc starts at H2 because H1 was on a title page.
 *     If no H1 exists, promote the shallowest heading to H1.
 *   - Stray ALL-CAPS lines that should clearly be headings but weren't tagged.
 *     Conservative: only promote isolated 4-60 char ALL-CAPS lines surrounded
 *     by blank lines.
 */
export function fixHeadings(md: string): string {
  let out = md;

  // 1. Promote shallowest level to H1 if no H1 exists
  const hasH1 = /^#\s/m.test(out);
  if (!hasH1) {
    const levels = new Set<number>();
    for (const m of out.matchAll(/^(#{2,6})\s/gm)) levels.add(m[1]!.length);
    if (levels.size > 0) {
      const shallowest = Math.min(...levels);
      const promoteBy = shallowest - 1;
      out = out.replace(/^(#{2,6})(\s)/gm, (_, hashes: string, sp: string) => {
        return "#".repeat(hashes.length - promoteBy) + sp;
      });
    }
  }

  // 2. Stray ALL-CAPS isolated line → H2 (skip if any lowercase, numeric-only, or punctuation-only)
  out = out.replace(
    /(^|\n)\n([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ0-9 ,&\-]{3,58}[A-ZÁÉÍÓÚÑÜ0-9])\n\n/g,
    (_full, prefix: string, line: string) => {
      if (/[a-záéíóúñü]/.test(line)) return _full as string;
      return `${prefix}\n## ${toTitleCase(line)}\n\n`;
    },
  );

  return out;
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(\w)/g, (c) => c.toUpperCase());
}
