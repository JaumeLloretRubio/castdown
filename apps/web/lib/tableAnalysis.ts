/**
 * Heuristica client-side para detectar tablas que probablemente salgan mal
 * en el render PDF segun template. Estima ancho disponible por columna del
 * template vs. caracteres del contenido. Permite mostrar warning preventivo
 * antes de gastar un render que va a fallar visualmente.
 *
 * Limitacion: solo analiza tablas pipe (`| a | b |`). Tablas tipo Setext/grid
 * no se detectan. Es heuristica - puede tener falsos positivos/negativos.
 */

export interface TableInfo {
  rows: number;
  cols: number;
  maxCellChars: number;
}

export interface TableWarning {
  level: "mild" | "severe";
  template: string;
  count: number;
  message: string;
  suggestion?: string;
}

// Ancho aprox del area de contenido por template, en cm.
// 2-col templates dividen el espacio por la mitad para tablas.
const CONTENT_WIDTH_CM: Record<string, number> = {
  report: 17,
  minimal: 16,
  compact: 18,
  ieee: 8.5,
  acm: 8.5,
  "two-column": 8.7,
  "springer-lncs": 15,
  apa: 15,
  nature: 16,
  thesis: 15,
};

// Orden de sugerencia: mas ancho primero.
const SUGGESTIONS = ["compact", "report", "minimal", "nature", "thesis", "apa"];

const isPipeRow = (s: string) => /^\s*\|.+\|\s*$/.test(s);
const isSeparator = (s: string) =>
  /^\s*\|?[\s:|-]+\|?\s*$/.test(s) && /---/.test(s);

function splitRow(row: string): string[] {
  // |a|b|c| -> ["a","b","c"]; tolera escaped pipes \\|
  return row
    .split(/(?<!\\)\|/)
    .map((c) => c.trim())
    .filter((_, i, arr) => i > 0 && i < arr.length - 1);
}

export function parseMdTables(md: string): TableInfo[] {
  const lines = md.split("\n");
  const tables: TableInfo[] = [];
  let inTable = false;
  let rows = 0,
    cols = 0,
    maxCell = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!inTable) {
      const next = lines[i + 1] ?? "";
      if (isPipeRow(line) && isSeparator(next)) {
        const cells = splitRow(line);
        cols = cells.length;
        maxCell = Math.max(0, ...cells.map((c) => c.length));
        rows = 1;
        inTable = true;
        i++; // skip separator
      }
    } else {
      if (isPipeRow(line)) {
        const cells = splitRow(line);
        maxCell = Math.max(maxCell, ...cells.map((c) => c.length));
        rows++;
      } else {
        tables.push({ rows, cols, maxCellChars: maxCell });
        inTable = false;
        rows = 0;
        cols = 0;
        maxCell = 0;
      }
    }
  }
  if (inTable) tables.push({ rows, cols, maxCellChars: maxCell });
  return tables;
}

export function analyzeTablesForTemplate(
  md: string,
  template: string | undefined,
  target: string,
): TableWarning | null {
  // Solo PDF tiene constraint de ancho fisico; otros wrap-friendly.
  if (target !== "pdf") return null;

  const tables = parseMdTables(md);
  if (tables.length === 0) return null;

  const tpl = template ?? "report";
  const widthCm = CONTENT_WIDTH_CM[tpl] ?? 16;

  let severe = 0;
  let mild = 0;
  for (const t of tables) {
    if (t.cols === 0) continue;
    const perCol = widthCm / t.cols;
    // ~0.18 cm/char a 10pt body; mayor para fuentes mas grandes.
    const needed = t.maxCellChars * 0.18;
    const ratio = needed / perCol;
    if (ratio > 3.5) severe++;
    else if (ratio > 2) mild++;
  }

  if (severe === 0 && mild === 0) return null;

  const level: "severe" | "mild" = severe > 0 ? "severe" : "mild";
  const count = severe + mild;
  const suggestion = SUGGESTIONS.find(
    (s) => s !== tpl && (CONTENT_WIDTH_CM[s] ?? 0) > widthCm,
  );

  return {
    level,
    template: tpl,
    count,
    message:
      level === "severe"
        ? `${count} tabla${count > 1 ? "s" : ""} con celdas muy largas no van a caber bien en "${tpl}".`
        : `${count} tabla${count > 1 ? "s" : ""} con celdas largas pueden hacer wrap fuerte en "${tpl}".`,
    suggestion,
  };
}
