import { execa } from "execa";
import { RenderArgs, templatePath } from "./common.js";

/**
 * PPTX via pandoc nativo. No depende de Chrome/puppeteer.
 *
 * Decision arquitectura (sesion 10): se descarto Marp como engine principal
 * porque marp-cli + puppeteer cuelga en Windows native dev y la deteccion
 * de Chrome es fragil. Pandoc native pptx writer es estable cross-platform
 * y no requiere binarios browser.
 *
 * Trade-off: se pierden los CSS themes de Marp (`templates/pptx/*.css`).
 * Reemplazo: reference docs `.pptx` (mismo patron que docx via --reference-doc).
 * Para crear: abre pptx default en PowerPoint/LibreOffice Impress, define
 * estilos master, guarda como `templates/pptx/<name>.pptx`.
 */
export async function renderPptx({ inputPath, outputPath, template }: RenderArgs): Promise<void> {
  const args = ["-f", "markdown", "-t", "pptx", "-o", outputPath];
  const ref = template ? templatePath("pptx", template, "pptx") : undefined;
  if (ref) args.push("--reference-doc", ref);
  args.push(inputPath);
  await execa("pandoc", args);
}
