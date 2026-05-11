import { execa } from "execa";
import { RenderArgs, templatePath } from "./common.js";

export async function renderEpub({ inputPath, outputPath, template }: RenderArgs): Promise<void> {
  const args = ["-f", "markdown", "-o", outputPath];
  const css = template ? templatePath("epub", template, "css") : undefined;
  if (css) args.push("--css", css);
  args.push(inputPath);
  await execa("pandoc", args);
}
