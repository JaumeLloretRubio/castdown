import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { z } from "zod";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pino from "pino";
import { renderPdf } from "./handlers/pdf.js";
import { renderDocx } from "./handlers/docx.js";
import { renderHtml } from "./handlers/html.js";
import { renderPptx } from "./handlers/pptx.js";
import { renderEpub } from "./handlers/epub.js";
import { renderLatex } from "./handlers/latex.js";
import { listAllTemplates } from "./handlers/common.js";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });
const PORT = Number(process.env.PORT ?? 8002);

const renderSchema = z.object({
  markdown: z.string().min(1),
  target: z.enum(["pdf", "docx", "html", "pptx", "epub", "xlsx", "tex"]),
  template: z.string().optional(),
  engine: z.enum(["typst", "weasyprint"]).optional(), // pdf only
});

const app = new Hono();

app.get("/health", (c) =>
  c.json({ status: "ok", service: "pandoc", version: "0.1.0-alpha" }),
);

// Lista templates disponibles por target. Usado por el frontend para poblar el selector.
app.get("/templates", (c) => c.json({ templates: listAllTemplates() }));

app.post("/render", async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = renderSchema.safeParse(json);
  if (!parsed.success) return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);

  const { markdown, target, template, engine } = parsed.data;
  const workdir = await mkdtemp(join(tmpdir(), "castdown-"));
  const inputPath = join(workdir, "in.md");
  const outputPath = join(workdir, `out.${target}`);

  try {
    await writeFile(inputPath, markdown, "utf8");
    const t0 = Date.now();

    switch (target) {
      case "pdf":   await renderPdf({ inputPath, outputPath, template, engine, workdir }); break;
      case "docx":  await renderDocx({ inputPath, outputPath, template, workdir }); break;
      case "html":  await renderHtml({ inputPath, outputPath, template, workdir }); break;
      case "pptx":  await renderPptx({ inputPath, outputPath, template, workdir }); break;
      case "epub":  await renderEpub({ inputPath, outputPath, template, workdir }); break;
      case "tex":   await renderLatex({ inputPath, outputPath, template, workdir }); break;
      case "xlsx":  throw new Error("xlsx_not_yet_implemented");
    }

    const data = await readFile(outputPath);
    const elapsedMs = Date.now() - t0;
    log.info({ target, template, engine, elapsedMs, bytes: data.length }, "render_ok");

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": mimeFor(target),
        "Content-Disposition": `attachment; filename="document.${target}"`,
        "X-Elapsed-Ms": String(elapsedMs),
      },
    });
  } catch (e) {
    log.error({ err: e, target, template }, "render_failed");
    return c.json({ error: "render_failed", message: (e as Error).message }, 500);
  } finally {
    rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
});

function mimeFor(target: string): string {
  switch (target) {
    case "pdf": return "application/pdf";
    case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "html": return "text/html; charset=utf-8";
    case "pptx": return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case "epub": return "application/epub+zip";
    case "xlsx": return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "tex":  return "application/x-tex; charset=utf-8";
    default: return "application/octet-stream";
  }
}

serve({ fetch: app.fetch, port: PORT, hostname: "0.0.0.0" }, (info) => {
  log.info({ port: info.port }, "pandoc-svc listening");
});
