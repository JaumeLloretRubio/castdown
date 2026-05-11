import { execa } from "execa";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { RenderArgs, TEMPLATES_DIR } from "./common.js";

/**
 * PPTX via Marp. The CSS theme lives at templates/pptx/<template>.css.
 * If `template` is omitted we let Marp use its bundled default.
 */
export async function renderPptx({ inputPath, outputPath, template }: RenderArgs): Promise<void> {
  const args: string[] = [];

  if (template) {
    const themePath = join(TEMPLATES_DIR, "pptx", `${template}.css`);
    if (existsSync(themePath)) {
      args.push("--theme-set", join(TEMPLATES_DIR, "pptx"));
      args.push("--theme", template);
    }
  }

  args.push("--pptx", "-o", outputPath, inputPath);
  // Marp expects MD with marp directives; we trust pandoc-flavored MD will mostly work
  // for plain slide decks. For advanced layouts, the input should already be Marp-flavored.
  await execa("marp", args, { env: { ...process.env, CHROME_PATH: "/usr/bin/chromium" } });
}
