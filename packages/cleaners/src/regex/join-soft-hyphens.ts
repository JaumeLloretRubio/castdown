/**
 * joinSoftHyphens — rejoin words split by line-end hyphens (common in PDF).
 *   "exam-\nple"  →  "example"
 *   "Conway-\nMaxwell"  → "Conway-Maxwell"  (preserves real compound hyphens)
 *
 * Heuristic: only join when next char is lowercase letter.
 */
export function joinSoftHyphens(md: string): string {
  return md.replace(/(\w)-\n([a-záéíóúñü])/g, "$1$2");
}
