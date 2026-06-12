import { Hono, type Context } from "hono";
import { z } from "zod";
import { clean } from "castdown-cleaners";
import { env } from "../env.js";
import { logger } from "../logger.js";
import { createJob, completeJob, failJob } from "../db/repo.js";
import type { AppEnv } from "../types.js";

export const castRoute = new Hono<AppEnv>();

const castFromMdSchema = z.object({
  markdown: z.string().min(1),
  target: z.enum(["pdf", "docx", "html", "pptx", "epub", "xlsx", "tex"]),
  template: z.string().optional(),
});

const castFromFileQuery = z.object({
  skip_cleaners: z.string().optional(),       // comma-separated cleaner names to skip
  raw: z.string().optional(),                 // "1" → skip the whole cleaners pipeline
});

// ────────────────────────────────────────────────────────────────
// File → Markdown    (multipart)
// MD → format        (application/json)
// ────────────────────────────────────────────────────────────────
castRoute.post("/", async (c) => {
  const contentType = c.req.header("Content-Type") ?? "";

  if (contentType.startsWith("multipart/form-data")) {
    return castFileToMd(c);
  }
  if (contentType.startsWith("application/json")) {
    return castMdToFormat(c);
  }
  return c.json({ error: "unsupported_content_type", got: contentType }, 415);
});

async function castFileToMd(c: Context<AppEnv>) {
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!(file instanceof File)) return c.json({ error: "file_required" }, 400);

  const sizeMb = file.size / 1_048_576;
  if (sizeMb > env.MAX_FILE_SIZE_MB) {
    return c.json({ error: "file_too_large", max_mb: env.MAX_FILE_SIZE_MB }, 413);
  }

  const apiKeyId = c.get("apiKeyId") ?? null;
  const jobId = createJob("cast", apiKeyId, {
    filename: file.name,
    size_bytes: file.size,
    mime: file.type,
  });

  const query = castFromFileQuery.parse({
    skip_cleaners: c.req.query("skip_cleaners"),
    raw: c.req.query("raw"),
  });

  const t0 = Date.now();
  try {
    // 1. Forward to markitdown-svc
    const fd = new FormData();
    fd.append("file", file);
    const upstream = await fetch(`${env.MARKITDOWN_URL}/cast`, { method: "POST", body: fd });
    if (!upstream.ok) {
      const elapsed = Date.now() - t0;
      failJob(jobId, `markitdown_failed:${upstream.status}`, elapsed);
      return c.json({ error: "conversion_failed", upstream: upstream.status, job_id: jobId }, 502);
    }
    const upstreamJson = (await upstream.json()) as { markdown: string; meta?: Record<string, unknown> };

    // 2. Clean (unless raw=1)
    let markdown = upstreamJson.markdown;
    let applied: string[] = [];
    if (query.raw !== "1") {
      const result = await clean(markdown, {
        skip: query.skip_cleaners?.split(",").map((s) => s.trim()).filter(Boolean),
        source: inferSource(file.name),
      });
      markdown = result.markdown;
      applied = result.applied;
    }

    const elapsed = Date.now() - t0;
    completeJob(jobId, { outputBytes: markdown.length, elapsedMs: elapsed, cleaners: applied });

    return c.json({
      markdown,
      meta: {
        job_id: jobId,
        filename: file.name,
        size_bytes: file.size,
        elapsed_ms: elapsed,
        engine: (upstreamJson.meta?.engine as string) ?? "markitdown",
        cleaners_applied: applied,
        chars: markdown.length,
      },
    });
  } catch (e) {
    const elapsed = Date.now() - t0;
    const msg = (e as Error).message;
    failJob(jobId, msg, elapsed);
    logger.error({ err: e, jobId }, "cast_file_to_md_failed");
    return c.json({ error: "internal_error", message: msg, job_id: jobId }, 500);
  }
}

async function castMdToFormat(c: Context<AppEnv>) {
  const json = await c.req.json();
  const parsed = castFromMdSchema.safeParse(json);
  if (!parsed.success) return c.json({ error: "invalid_body", issues: parsed.error.issues }, 400);

  const apiKeyId = c.get("apiKeyId") ?? null;
  const jobId = createJob("render", apiKeyId, {
    target: parsed.data.target,
    template: parsed.data.template,
    chars: parsed.data.markdown.length,
  });

  const t0 = Date.now();
  try {
    const res = await fetch(`${env.PANDOC_URL}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (!res.ok) {
      const elapsed = Date.now() - t0;
      failJob(jobId, `pandoc_failed:${res.status}`, elapsed);
      return c.json({ error: "render_failed", upstream: res.status, job_id: jobId }, 502);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    const elapsed = Date.now() - t0;
    completeJob(jobId, { outputBytes: buf.length, elapsedMs: elapsed });

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
        "X-Job-Id": jobId,
        "X-Elapsed-Ms": String(elapsed),
      },
    });
  } catch (e) {
    const elapsed = Date.now() - t0;
    const msg = (e as Error).message;
    failJob(jobId, msg, elapsed);
    logger.error({ err: e, jobId }, "cast_md_to_format_failed");
    return c.json({ error: "internal_error", message: msg, job_id: jobId }, 500);
  }
}

function inferSource(filename: string): "pdf" | "docx" | "pptx" | "html" | "epub" | "unknown" {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf": return "pdf";
    case "docx": case "doc": return "docx";
    case "pptx": case "ppt": return "pptx";
    case "html": case "htm": return "html";
    case "epub": return "epub";
    default: return "unknown";
  }
}
