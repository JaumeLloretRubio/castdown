import type { CleanOptions } from "../index.js";

const BOILERPLATE_PATTERNS: RegExp[] = [
  /^[^\n]*(?:©|&copy;|\bCopyright\b)[^\n]*\d{4}[^\n]*$/gim,
  /^\s*All rights reserved\.?\s*$/gim,
  /^\s*(?:CONFIDENTIAL|PROPRIETARY|FOR INTERNAL USE ONLY|DRAFT)\s*\.?\s*$/gim,
];

export function stripBoilerplate(md: string, opts?: CleanOptions): string {
  if (opts?.keepBoilerplate) return md;
  let out = md;
  for (const re of BOILERPLATE_PATTERNS) {
    re.lastIndex = 0;
    out = out.replace(re, "");
  }
  return out;
}
