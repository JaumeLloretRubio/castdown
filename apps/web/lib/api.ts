"use client";

/**
 * Thin client over the castdown API. Next.js rewrites /api/* to the gateway,
 * so we just hit relative paths from the browser.
 *
 * Auth model:
 *   - Production (Vercel + Pi via tunnel): middleware.ts inyecta
 *     `Authorization: Bearer <CASTDOWN_API_KEY>` server-side antes del rewrite.
 *     El browser NUNCA envía X-API-Key en las llamadas reales.
 *   - `validateKey()` es la excepción: envía X-API-Key explícito para que el
 *     SettingsModal pueda probar una key candidata sin persistirla.
 */
export interface CastFileResponse {
  markdown: string;
  meta: {
    job_id: string;
    filename: string;
    size_bytes: number;
    elapsed_ms: number;
    engine: string;
    cleaners_applied: string[];
    chars: number;
  };
}

export const DEFAULT_DEV_KEY = "cd_dev_changeme";

// Sin X-API-Key: el middleware Vercel inyecta Authorization server-side.
// Si se enviase X-API-Key desde browser, la gateway lo leería primero (auth.ts)
// y anularía la inyección segura del middleware. Mantener vacío.
const headers = (): HeadersInit => ({});

export interface WhoAmI {
  ok: true;
  key_id: string | null;
  source: "db" | "env";
  rate_limit_per_min: number;
  scopes: string[];
}

export async function validateKey(candidate: string): Promise<WhoAmI> {
  const res = await fetch(`/api/whoami`, { headers: { "X-API-Key": candidate } });
  if (res.status === 401) throw new Error("unauthorized");
  if (!res.ok) throw new Error(`api ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function castFile(file: File, opts: { skipCleaners?: string[]; raw?: boolean } = {}): Promise<CastFileResponse> {
  const params = new URLSearchParams();
  if (opts.skipCleaners?.length) params.set("skip_cleaners", opts.skipCleaners.join(","));
  if (opts.raw) params.set("raw", "1");
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`/api/cast${params.toString() ? "?" + params : ""}`, {
    method: "POST",
    headers: headers(),
    body: fd,
  });
  if (!res.ok) throw new Error(`api ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function renderMd(markdown: string, target: string, template?: string): Promise<Blob> {
  const res = await fetch(`/api/cast`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ markdown, target, template }),
  });
  if (!res.ok) throw new Error(`api ${res.status}: ${await res.text()}`);
  return res.blob();
}

export async function crawl(url: string, depth: number, maxPages: number): Promise<Blob> {
  const res = await fetch(`/api/crawl`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ url, depth, max_pages: maxPages, format: "zip" }),
  });
  if (!res.ok) throw new Error(`api ${res.status}: ${await res.text()}`);
  return res.blob();
}

export async function getHealth(): Promise<{ status: string; services: Record<string, { ok: boolean; latencyMs?: number }> }> {
  const res = await fetch(`/health`);
  return res.json();
}

export interface TemplateEntry { name: string; isDefault: boolean }
export interface TemplatesResponse {
  templates: Record<string, TemplateEntry[]>;
}

export async function getTemplates(): Promise<TemplatesResponse> {
  const res = await fetch(`/api/templates`, { headers: headers() });
  if (!res.ok) throw new Error(`api ${res.status}: ${await res.text()}`);
  return res.json();
}
