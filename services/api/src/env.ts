import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  API_PORT: z.coerce.number().default(3001),
  API_HOST: z.string().default("0.0.0.0"),
  API_PUBLIC_URL: z.string().url().default("http://localhost:3001"),

  API_KEYS: z.string().default("cd_dev_changeme"),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().default(60),

  // CORS allowlist (comma-separated). Default cubre dev local; en prod añadir el dominio Vercel.
  WEB_ORIGIN: z.string().default("http://localhost:3000"),

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
