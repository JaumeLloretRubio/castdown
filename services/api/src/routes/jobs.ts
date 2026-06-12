import { Hono } from "hono";
import { findJob } from "../db/repo.js";
import type { AppEnv } from "../types.js";

export const jobsRoute = new Hono<AppEnv>();

jobsRoute.get("/:id", (c) => {
  const id = c.req.param("id");
  const job = findJob(id);
  if (!job) return c.json({ error: "job_not_found" }, 404);

  // Ownership check: a key may only read its own jobs. Return 404 (not 403) so
  // job IDs of other keys aren't confirmable. env-keys (apiKeyId === null) see
  // only null-owned jobs.
  if (job.api_key_id !== (c.get("apiKeyId") ?? null)) {
    return c.json({ error: "job_not_found" }, 404);
  }

  return c.json({
    id: job.id,
    kind: job.kind,
    status: job.status,
    elapsed_ms: job.elapsed_ms,
    output_bytes: job.output_bytes,
    error: job.error,
    cleaners: job.cleaners ? JSON.parse(job.cleaners) : null,
    input_meta: job.input_meta ? JSON.parse(job.input_meta) : null,
    created_at: job.created_at,
    finished_at: job.finished_at,
  });
});
