import type { MiddlewareHandler } from "hono";
import { Redis } from "ioredis";
import { env } from "../env.js";
import { logger } from "../logger.js";
import type { AppEnv } from "../types.js";

/**
 * Redis is optional. Local-dev without Redis must not spam reconnect errors.
 * Strategy:
 *   1. lazyConnect — don't open a socket until first command.
 *   2. retryStrategy = null on connect failure — disables auto-reconnect.
 *   3. After first failure we mark the client dead; the middleware fails open.
 */
let redisDead = false;
const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
  reconnectOnError: () => false,
  enableOfflineQueue: false,
});

redis.on("error", (err) => {
  if (!redisDead) {
    redisDead = true;
    logger.warn({ err: err.message }, "redis_unavailable_failing_open");
  }
});

redis.connect().catch(() => {
  // already surfaced via `error` event
});

export const rateLimitMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const key = c.get("apiKey");
  if (!key || redisDead) return next();

  const limit = c.get("rateLimit") ?? env.RATE_LIMIT_PER_MINUTE;
  const bucket = `rl:${key}:${Math.floor(Date.now() / 60_000)}`;

  try {
    const count = await redis.incr(bucket);
    if (count === 1) await redis.expire(bucket, 60);
    if (count > limit) {
      return c.json({ error: "rate_limited", retry_after_seconds: 60 }, 429);
    }
    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(Math.max(0, limit - count)));
  } catch {
    // Fail open
  }
  await next();
};
