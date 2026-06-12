import { withProtectedCode } from "../util/protect-code.js";

export function normalizeNumberedLists(md: string): string {
  return withProtectedCode(md, (s) =>
    s
      .replace(/^([ \t]*)(\d+)\)(?=[ \t])/gm, "$1$2.")
      .replace(/^([ \t]*)\((\d+)\)(?=[ \t])/gm, "$1$2.")
      .replace(/^([ \t]*)([a-z])\)(?=[ \t])/gm, "$1$2.")
      .replace(/^([ \t]*)\(([a-z])\)(?=[ \t])/gm, "$1$2."),
  );
}
