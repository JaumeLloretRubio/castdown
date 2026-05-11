import { Hono } from "hono";
import { env } from "../env.js";

export const healthRoute = new Hono();

healthRoute.get("/", async (c) => {
  const services = {
    markitdown: await ping(env.MARKITDOWN_URL),
    pandoc: await ping(env.PANDOC_URL),
    crawler: await ping(env.CRAWLER_URL),
  };
  const ok = Object.values(services).every((s) => s.ok);
  return c.json({ status: ok ? "ok" : "degraded", services, version: "0.1.0-alpha" }, ok ? 200 : 503);
});

async function ping(url: string): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  const t0 = Date.now();
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
    return { ok: res.ok, latencyMs: Date.now() - t0 };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
