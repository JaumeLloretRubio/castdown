import { Hono } from "hono";
import type { AppEnv } from "../types.js";

export const whoamiRoute = new Hono<AppEnv>();

whoamiRoute.get("/", (c) => {
  const apiKeyId = c.get("apiKeyId");
  const rateLimit = c.get("rateLimit");
  const scopes = c.get("scopes");
  return c.json({
    ok: true,
    key_id: apiKeyId,
    source: apiKeyId ? "db" : "env",
    rate_limit_per_min: rateLimit,
    scopes,
  });
});
