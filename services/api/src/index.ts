import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import { cors } from "hono/cors";
import { env } from "./env.js";
import { logger } from "./logger.js";
import "./db/index.js"; // bootstrap schema
import { authMiddleware } from "./middleware/auth.js";
import { rateLimitMiddleware } from "./middleware/ratelimit.js";
import { castRoute } from "./routes/cast.js";
import { crawlRoute } from "./routes/crawl.js";
import { jobsRoute } from "./routes/jobs.js";
import { healthRoute } from "./routes/health.js";
import { whoamiRoute } from "./routes/whoami.js";
import { templatesRoute } from "./routes/templates.js";
import { startCleanupCron } from "./cron/cleanup.js";

import type { AppEnv } from "./types.js";

const app = new Hono<AppEnv>();

app.use("*", honoLogger());
app.use(
  "*",
  cors({
    origin: env.WEB_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean),
    credentials: false,
  }),
);

app.route("/health", healthRoute);

const api = new Hono<AppEnv>();
api.use("*", authMiddleware);
api.use("*", rateLimitMiddleware);
api.route("/cast", castRoute);
api.route("/crawl", crawlRoute);
api.route("/jobs", jobsRoute);
api.route("/whoami", whoamiRoute);
api.route("/templates", templatesRoute);
app.route("/api", api);

app.notFound((c) => c.json({ error: "not_found", path: c.req.path }, 404));
app.onError((err, c) => {
  logger.error({ err }, "unhandled_error");
  return c.json({ error: "internal_error", message: err.message }, 500);
});

const port = Number(env.API_PORT);
serve({ fetch: app.fetch, port, hostname: env.API_HOST }, (info) => {
  logger.info({ port: info.port, host: env.API_HOST }, "castdown api listening");
});

// Background TTL cleanup
startCleanupCron();
