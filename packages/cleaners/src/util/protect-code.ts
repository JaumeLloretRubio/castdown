/**
 * Masks fenced and indented code blocks with placeholders before applying a
 * transformation, then restores them. Prevents cleaners from corrupting code.
 */
export function withProtectedCode(md: string, fn: (masked: string) => string): string {
  const blocks: string[] = [];

  const FENCED_RE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1[ \t]*$/gm;
  let masked = md.replace(FENCED_RE, (match) => {
    const i = blocks.push(match) - 1;
    return `\x00CODE_${i}\x00`;
  });

  // Only protect indented blocks that contain at least one non-whitespace char
  masked = masked.replace(
    /(^|\n)((?:[ ]{4}|\t)[^\n]*\S[^\n]*(?:\n(?:[ ]{4}|\t)[^\n]*\S[^\n]*)*)/g,
    (_, sep: string, block: string) => {
      const i = blocks.push(block) - 1;
      return `${sep}\x00CODE_${i}\x00`;
    },
  );

  const result = fn(masked);

  return result.replace(/\x00CODE_(\d+)\x00/g, (_, i) => blocks[+i] ?? "");
}
