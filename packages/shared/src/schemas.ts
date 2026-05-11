import { z } from "zod";

export const InputFormat = z.enum([
  "pdf", "docx", "pptx", "xlsx", "html", "epub", "rst", "odt",
  "csv", "txt", "png", "jpg", "wav", "mp3",
]);

export const OutputFormat = z.enum([
  "pdf", "docx", "html", "pptx", "epub", "xlsx", "md",
]);

export const CastFromFileResponse = z.object({
  markdown: z.string(),
  meta: z.object({
    filename: z.string(),
    size_bytes: z.number(),
    elapsed_ms: z.number(),
    engine: z.string(),
    cleaners_applied: z.array(z.string()).optional(),
  }),
});

export const RenderRequest = z.object({
  markdown: z.string().min(1),
  target: OutputFormat,
  template: z.string().optional(),
});

export const CrawlRequest = z.object({
  url: z.string().url(),
  depth: z.number().int().min(1).max(5).default(2),
  format: z.enum(["zip", "flat", "tree"]).default("zip"),
  max_pages: z.number().int().min(1).max(500).default(100),
  render_js: z.boolean().default(true),
});

export const ErrorResponse = z.object({
  error: z.string(),
  message: z.string().optional(),
  issues: z.array(z.unknown()).optional(),
});
