"use client";

/**
 * Thin client over the castdown API. Next.js rewrites /api/* to the gateway,
 * so we just hit relative paths from the browser.
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

export function getApiKey(): string {
  if (typeof window === "undefined") return DEFAULT_DEV_KEY;
  return window.localStorage.getItem("cd_api_key") || DEFAULT_DEV_KEY;
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  if (key.trim()) window.localStorage.setItem("cd_api_key", key.trim());
  else window.localStorage.removeItem("cd_api_key");
  window.dispatchEvent(new CustomEvent("cd:api-key-changed"));
}

const headers = (): HeadersInit => ({ "X-API-Key": getApiKey() });

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
