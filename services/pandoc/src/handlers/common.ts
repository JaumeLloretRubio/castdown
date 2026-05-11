import { dirname, join, resolve } from "node:path";
import { existsSync } from "node:fs";
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
