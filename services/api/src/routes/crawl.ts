import { Hono } from "hono";
import { z } from "zod";
import { env } from "../env.js";
import type { AppEnv } from "../types.js";

export const crawlRoute = new Hono<AppEnv>();

const schema = z.object({
  url: z.string().url(),
  depth: z.number().int().min(1).max(5).default(2),
  format: z.enum(["zip", "flat", "tree"]).default("zip"),
  max_pages: z.number().int().min(1).max(500).optional(),
  render_js: z.boolean().default(true),
});

crawlRoute.post("/", async (c) => {
  const json = await c.req.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);

  const res = await fetch(`${env.CRAWLER_URL}/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });
  if (!res.ok) return c.json({ error: "crawl_failed", upstream: res.status }, 502);
  return new Response(res.body, {
    status: 200,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream" },
  });
});
