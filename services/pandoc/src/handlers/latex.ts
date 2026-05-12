/**
 * LaTeX export. Genera un `.tex` standalone listo para compilar con
 * `pdflatex`/`xelatex`/`lualatex` localmente. NO compilamos aqui — la idea es
 * que el usuario lo pueda llevar al venue/repositorio y compilar con su cls.
 *
 * Templates opcionales en `templates/latex/<name>.tex` (formato pandoc
 * template: $title$, $body$, $for(author)$...).
 */
import { execa } from "execa";
import { RenderArgs, templatePath } from "./common.js";

export async function renderLatex({ inputPath, outputPath, template }: RenderArgs): Promise<void> {
  const args = ["-f", "markdown", "-t", "latex", "-s", "-o", outputPath];
  const tpl = template ? templatePath("tex", template, "tex") : undefined;
  if (tpl) args.push("--template", tpl);
  args.push(inputPath);
  await execa("pandoc", args);
}
