import { execa } from "execa";
import { RenderArgs, templatePath } from "./common.js";

export async function renderDocx({ inputPath, outputPath, template }: RenderArgs): Promise<void> {
  const args = ["-f", "markdown", "-o", outputPath];
  const ref = template ? templatePath("docx", template, "docx") : undefined;
  if (ref) args.push("--reference-doc", ref);
  args.push(inputPath);
  await execa("pandoc", args);
}
