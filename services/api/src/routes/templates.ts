import { Hono } from "hono";
import { env } from "../env.js";
import { logger } from "../logger.js";
import type { AppEnv } from "../types.js";

export const templatesRoute = new Hono<AppEnv>();

// Passthrough a pandoc-svc /templates. Devuelve los templates disponibles
// por target para que el frontend pueble el selector dinamicamente.
// Se cachea en memoria 5 min para evitar disk reads repetidos.
let cache: { ts: number; payload: unknown } | null = null;
const TTL_MS = 5 * 60 * 1000;

templatesRoute.get("/", async (c) => {
  if (cache && Date.now() - cache.ts < TTL_MS) {
    return c.json(cache.payload);
  }
  try {
    const res = await fetch(`${env.PANDOC_URL}/templates`);
    if (!res.ok) {
      return c.json({ error: "upstream_failed", status: res.status }, 502);
    }
    const json = await res.json();
    cache = { ts: Date.now(), payload: json };
    return c.json(json);
  } catch (e) {
    logger.error({ err: e }, "templates_fetch_failed");
    return c.json({ error: "internal_error", message: (e as Error).message }, 500);
  }
});
