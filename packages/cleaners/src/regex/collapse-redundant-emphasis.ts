import { withProtectedCode } from "../util/protect-code.js";

export function collapseRedundantEmphasis(md: string): string {
  return withProtectedCode(md, (s) => {
    let out = s;
    for (let i = 0; i < 5; i++) {
      const prev = out;
      out = out
        .replace(/\*\*([^*\n]+)\*\*[ \t]+\*\*([^*\n]+)\*\*/g, "**$1 $2**")
        .replace(/__([^_\n]+)__[ \t]+__([^_\n]+)__/g, "__$1 $2__")
        .replace(/(?<!\*)\*([^*\n]+)\*[ \t]+\*([^*\n]+)\*(?!\*)/g, "*$1 $2*")
        .replace(/(?<!_)_([^_\n]+)_[ \t]+_([^_\n]+)_(?!_)/g, "_$1 $2_")
        .replace(/~~([^~\n]+)~~[ \t]+~~([^~\n]+)~~/g, "~~$1 $2~~");
      if (out === prev) break;
    }
    return out;
  });
}
