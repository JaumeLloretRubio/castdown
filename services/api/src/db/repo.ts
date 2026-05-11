/**
 * Repository layer over node:sqlite. Pure synchronous functions.
 * Keep raw SQL here; no ORM.
 *
 * node:sqlite quirk: prepared statements need
 *   `stmt.setAllowBareNamedParameters(true)` to accept `{ id: ... }` style
 *   binding against `@id` SQL placeholders. The `prep()` helper centralizes that.
 */
import { createHash, randomBytes } from "node:crypto";
import { db } from "./index.js";
import type { StatementSync } from "node:sqlite";

function prep(sql: string): StatementSync {
  const stmt = db.prepare(sql);
  stmt.setAllowBareNamedParameters(true);
  return stmt;
}

// ── ULID (Crockford base32) — small inline impl to avoid an extra dep ──
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function ulid(now = Date.now()): string {
  let time = now;
  const timeChars: string[] = [];
  for (let i = 0; i < 10; i++) {
    timeChars.unshift(CROCKFORD[time % 32] ?? "0");
    time = Math.floor(time / 32);
  }
  const rand = randomBytes(10);
  const randChars: string[] = [];
  for (let i = 0; i < 10; i++) randChars.push(CROCKFORD[(rand[i] ?? 0) % 32] ?? "0");
  return timeChars.join("") + randChars.join("");
}

// ── api_keys ──────────────────────────────────────────────────
export interface ApiKey {
  id: string;
  key_hash: string;
  name: string;
  scopes: string;
  rate_limit: number;
  created_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
}

const insertKey = prep(`
  INSERT INTO api_keys (id, key_hash, name, scopes, rate_limit, created_at)
  VALUES (@id, @key_hash, @name, @scopes, @rate_limit, @created_at)
`);
const findKeyByHash = prep(`
  SELECT * FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL
`);
const touchKey = prep(`
  UPDATE api_keys SET last_used_at = ? WHERE id = ?
`);

export function hashKey(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

export function issueApiKey(name: string, opts: { scopes?: string; rateLimit?: number } = {}): { id: string; key: string } {
  const id = ulid();
  const key = `cd_live_${randomBytes(24).toString("base64url")}`;
  insertKey.run({
    id,
    key_hash: hashKey(key),
    name,
    scopes: opts.scopes ?? "cast,crawl,render",
    rate_limit: opts.rateLimit ?? 60,
    created_at: Date.now(),
  });
  return { id, key };
}

export function findApiKey(plain: string): ApiKey | undefined {
  const row = findKeyByHash.get(hashKey(plain)) as ApiKey | undefined;
  if (row) touchKey.run(Date.now(), row.id);
  return row;
}

// ── jobs ──────────────────────────────────────────────────────
export type JobKind = "cast" | "render" | "crawl";
export type JobStatus = "queued" | "running" | "done" | "error";

export interface Job {
  id: string;
  kind: JobKind;
  status: JobStatus;
  api_key_id: string | null;
  input_meta: string | null;
  output_path: string | null;
  output_bytes: number | null;
  error: string | null;
  elapsed_ms: number | null;
  cleaners: string | null;
  created_at: number;
  finished_at: number | null;
}

const insertJob = prep(`
  INSERT INTO jobs (id, kind, status, api_key_id, input_meta, created_at)
  VALUES (@id, @kind, @status, @api_key_id, @input_meta, @created_at)
`);
const updateJob = prep(`
  UPDATE jobs SET
    status = @status,
    output_path = @output_path,
    output_bytes = @output_bytes,
    error = @error,
    elapsed_ms = @elapsed_ms,
    cleaners = @cleaners,
    finished_at = @finished_at
  WHERE id = @id
`);
const getJob = prep(`SELECT * FROM jobs WHERE id = ?`);

export function createJob(kind: JobKind, apiKeyId: string | null, inputMeta: unknown): string {
  const id = ulid();
  insertJob.run({
    id,
    kind,
    status: "running",
    api_key_id: apiKeyId,
    input_meta: inputMeta ? JSON.stringify(inputMeta) : null,
    created_at: Date.now(),
  });
  return id;
}

export function completeJob(id: string, patch: {
  outputPath?: string;
  outputBytes?: number;
  elapsedMs?: number;
  cleaners?: string[];
}): void {
  updateJob.run({
    id,
    status: "done",
    output_path: patch.outputPath ?? null,
    output_bytes: patch.outputBytes ?? null,
    error: null,
    elapsed_ms: patch.elapsedMs ?? null,
    cleaners: patch.cleaners ? JSON.stringify(patch.cleaners) : null,
    finished_at: Date.now(),
  });
}

export function failJob(id: string, error: string, elapsedMs?: number): void {
  updateJob.run({
    id,
    status: "error",
    output_path: null,
    output_bytes: null,
    error,
    elapsed_ms: elapsedMs ?? null,
    cleaners: null,
    finished_at: Date.now(),
  });
}

export function findJob(id: string): Job | undefined {
  return getJob.get(id) as Job | undefined;
}

// ── files ─────────────────────────────────────────────────────
export interface FileRow {
  id: string;
  sha256: string;
  path: string;
  size_bytes: number;
  mime: string | null;
  original_name: string | null;
  job_id: string | null;
  created_at: number;
  expires_at: number;
}

const insertFile = prep(`
  INSERT INTO files (id, sha256, path, size_bytes, mime, original_name, job_id, created_at, expires_at)
  VALUES (@id, @sha256, @path, @size_bytes, @mime, @original_name, @job_id, @created_at, @expires_at)
`);
const expiredFiles = prep(`
  SELECT * FROM files WHERE expires_at < ?
`);
const deleteFile = prep(`DELETE FROM files WHERE id = ?`);

export function recordFile(args: {
  sha256: string;
  path: string;
  sizeBytes: number;
  mime?: string;
  originalName?: string;
  jobId?: string;
  ttlMs: number;
}): string {
  const id = ulid();
  const now = Date.now();
  insertFile.run({
    id,
    sha256: args.sha256,
    path: args.path,
    size_bytes: args.sizeBytes,
    mime: args.mime ?? null,
    original_name: args.originalName ?? null,
    job_id: args.jobId ?? null,
    created_at: now,
    expires_at: now + args.ttlMs,
  });
  return id;
}

export function listExpiredFiles(now = Date.now()): FileRow[] {
  return expiredFiles.all(now) as unknown as FileRow[];
}

export function removeFileRecord(id: string): void {
  deleteFile.run(id);
}
