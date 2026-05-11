import { execa } from "execa";
import { join } from "node:path";
import { RenderArgs, TEMPLATES_DIR, templatePath } from "./common.js";

export async function renderHtml({ inputPath, outputPath, template }: RenderArgs): Promise<void> {
  const args = ["-f", "markdown", "-t", "html5", "-s", "-o", outputPath];
  const tpl = template
    ? templatePath("html", template, "html") ?? join(TEMPLATES_DIR, "html", "default.html")
    : join(TEMPLATES_DIR, "html", "default.html");
  args.push("--template", tpl);
  args.push(inputPath);
  await execa("pandoc", args);
}
