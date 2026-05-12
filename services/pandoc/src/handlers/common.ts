import { dirname, join, resolve } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Local dev: repo-root /templates is two service dirs above this file.
// Docker: TEMPLATES_DIR=/app/templates is set explicitly in the Dockerfile.
const moduleDir = dirname(fileURLToPath(import.meta.url));
export const TEMPLATES_DIR = process.env.TEMPLATES_DIR ?? resolve(moduleDir, "../../../../templates");

export interface RenderArgs {
  inputPath: string;
  outputPath: string;
  template?: string;
  workdir: string;
}

export function templatePath(target: string, template: string, ext: string): string | undefined {
  const p = join(TEMPLATES_DIR, target, `${template}.${ext}`);
  return existsSync(p) ? p : undefined;
}

// Map target -> file extension used as template by that handler.
// pptx ahora usa pandoc native con --reference-doc (.pptx), no marp/.css.
const EXT_BY_TARGET: Record<string, string> = {
  pdf: "typ",
  html: "html",
  pptx: "pptx",
  docx: "docx",
  epub: "css",
  tex: "tex",
};

export interface TemplateEntry {
  name: string;     // basename sin extension
  isDefault: boolean;
}

// Lee FS de templates/<target>/ y devuelve los templates disponibles.
// El primero (alfabetico) o el llamado "default"/"report" se marca como isDefault.
export function listTemplates(target: string): TemplateEntry[] {
  const ext = EXT_BY_TARGET[target];
  if (!ext) return [];
  const dir = join(TEMPLATES_DIR, target);
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir)
    .filter((f) => f.endsWith(`.${ext}`))
    .map((f) => f.slice(0, -(ext.length + 1)))
    .sort();

  // "default" si existe, sino "report" (pdf), sino el primero.
  const preferred = files.includes("default")
    ? "default"
    : files.includes("report")
    ? "report"
    : files[0];

  return files.map((name) => ({ name, isDefault: name === preferred }));
}

export function listAllTemplates(): Record<string, TemplateEntry[]> {
  const out: Record<string, TemplateEntry[]> = {};
  for (const target of Object.keys(EXT_BY_TARGET)) {
    out[target] = listTemplates(target);
  }
  return out;
}
