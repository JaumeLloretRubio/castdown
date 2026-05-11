/**
 * PDF rendering. Two paths:
 *
 *   typst (default, preferred):
 *     pandoc -t typst → produces a .typ snippet,
 *     prepended with the chosen template's preamble,
 *     compiled via `typst compile`.
 *
 *   weasyprint (fallback for HTML-style layouts):
 *     pandoc -t html5 -s --pdf-engine=weasyprint
 */
import { execa } from "execa";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { RenderArgs, TEMPLATES_DIR, templatePath } from "./common.js";

export async function renderPdf(args: RenderArgs & { engine?: "typst" | "weasyprint" }): Promise<void> {
  const engine = args.engine ?? "typst";

  if (engine === "typst") {
    return renderTypst(args);
  }
  return renderWeasyprint(args);
}

async function renderTypst({ inputPath, outputPath, template, workdir }: RenderArgs): Promise<void> {
  // 1. Markdown → Typst body
  const typBody = join(workdir, "body.typ");
  await execa("pandoc", ["-f", "markdown", "-t", "typst", "-o", typBody, inputPath]);
  const body = await readFile(typBody, "utf8");

  // 2. Compose final .typ: template preamble + body
  const preamblePath = template
    ? templatePath("pdf", template, "typ") ?? join(TEMPLATES_DIR, "pdf", "report.typ")
    : join(TEMPLATES_DIR, "pdf", "report.typ");
  const preamble = await readFile(preamblePath, "utf8");

  const finalTyp = join(workdir, "doc.typ");
  await writeFile(finalTyp, `${preamble}\n\n${body}`, "utf8");

  // 3. Compile
  await execa("typst", ["compile", "--root", workdir, finalTyp, outputPath]);
}

async function renderWeasyprint({ inputPath, outputPath, template }: RenderArgs): Promise<void> {
  const args = ["-f", "markdown", "-t", "html5", "-s", "--pdf-engine=weasyprint", "-o", outputPath];
  const tplPath = template ? templatePath("pdf", template, "html") : undefined;
  if (tplPath) args.push("--template", tplPath);
  args.push(inputPath);
  await execa("pandoc", args);
}
