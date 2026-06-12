import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default("0.0.0.0"),
  API_PUBLIC_URL: z.string().url().default("http://localhost:3001"),

  API_KEYS: z
    .string()
    .default("cd_dev_changeme")
    .refine(
      (v) => process.env.NODE_ENV !== "production" || !v.split(",").map((k) => k.trim()).includes("cd_dev_changeme"),
      { message: "API_KEYS must not contain cd_dev_changeme in production" },
    ),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().default(60),

  // CORS allowlist (comma-separated). Default cubre dev local; en prod añadir el dominio Vercel.
  // Validated: no wildcard, no empty list, every entry a parseable origin —
  // a misconfigured "*" or "" would otherwise open cross-origin access to the
  // publicly-reachable gateway.
  WEB_ORIGIN: z
    .string()
    .default("http://localhost:3000")
    .superRefine((v, ctx) => {
      const origins = v.split(",").map((s) => s.trim()).filter(Boolean);
      if (origins.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "WEB_ORIGIN must not be empty" });
        return;
      }
      for (const o of origins) {
        if (o === "*") {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "WEB_ORIGIN must not be '*' (wildcard CORS)" });
          continue;
        }
        try {
          new URL(o);
        } catch {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `WEB_ORIGIN entry is not a valid origin: ${o}` });
        }
      }
    }),

  MARKITDOWN_URL: z.string().url().default("http://markitdown-svc:8001"),
  PANDOC_URL: z.string().url().default("http://pandoc-svc:8002"),
  CRAWLER_URL: z.string().url().default("http://crawler-svc:8003"),

  STORAGE_PATH: z.string().default("/data"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  RESULT_TTL_HOURS: z.coerce.number().default(24),

  REDIS_URL: z.string().default("redis://redis:6379"),
  DATABASE_URL: z.string().default("file:/data/castdown.db"),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
