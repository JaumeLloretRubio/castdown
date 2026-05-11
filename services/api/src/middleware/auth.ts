import type { MiddlewareHandler } from "hono";
import { env } from "../env.js";
import { findApiKey } from "../db/repo.js";
import { logger } from "../logger.js";
import type { AppEnv } from "../types.js";

const envKeys = new Set(env.API_KEYS.split(",").map((k) => k.trim()).filter(Boolean));

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const raw = c.req.header("X-API-Key") ?? c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!raw) return c.json({ error: "unauthorized" }, 401);

  // Try DB-backed key first
  const row = findApiKey(raw);
  if (row) {
    c.set("apiKey", raw);
    c.set("apiKeyId", row.id);
    c.set("rateLimit", row.rate_limit);
    c.set("scopes", row.scopes.split(","));
    await next();
    return;
  }

  // Fallback to env-configured dev keys
  if (envKeys.has(raw)) {
    if (env.NODE_ENV === "production") {
      logger.warn({ keyPrefix: raw.slice(0, 10) }, "env_key_used_in_prod");
    }
    c.set("apiKey", raw);
    c.set("apiKeyId", null);
    c.set("rateLimit", env.RATE_LIMIT_PER_MINUTE);
    c.set("scopes", ["cast", "crawl", "render"]);
    await next();
    return;
  }

  return c.json({ error: "unauthorized" }, 401);
};
