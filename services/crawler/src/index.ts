import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { z } from "zod";
import pino from "pino";
import { crawlSite } from "./crawl.js";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });
const PORT = Number(process.env.PORT ?? 8003);

const schema = z.object({
  url: z.string().url(),
  depth: z.number().int().min(1).max(5).default(2),
  format: z.enum(["zip", "flat", "tree"]).default("zip"),
  max_pages: z.number().int().min(1).max(500).default(100),
  render_js: z.boolean().default(true),
});

const app = new Hono();

app.get("/health", (c) =>
  c.json({ status: "ok", service: "crawler", version: "0.1.0-alpha" }),
);

app.post("/crawl", async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);

  try {
    const { stream, contentType, filename } = await crawlSite(parsed.data);
    return new Response(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    log.error({ err: e }, "crawl_failed");
    return c.json({ error: "crawl_failed", message: (e as Error).message }, 500);
  }
});

serve({ fetch: app.fetch, port: PORT, hostname: "0.0.0.0" }, (info) => {
  log.info({ port: info.port }, "crawler-svc listening");
});
