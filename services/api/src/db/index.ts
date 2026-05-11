/**
 * SQLite connection + schema bootstrap via node:sqlite (stdlib, Node 22+).
 *
 * Why stdlib over better-sqlite3:
 *   - No native compile step; works on any Node ≥22 (stable in Node 24).
 *   - Cross-platform without prebuilt binaries.
 *   - API is close enough that the repo layer barely changes.
 *
 * DATABASE_URL forms:
 *   file:/data/castdown.db       — absolute (Linux / docker)
 *   file:./data/castdown.db      — relative (local dev / Windows)
 */
import { DatabaseSync, type StatementSync } from "node:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env.js";
import { logger } from "../logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveDbPath(url: string): string {
  if (!url.startsWith("file:")) {
    throw new Error(`DATABASE_URL must start with file: (got ${url})`);
  }
  return resolve(url.slice("file:".length));
}

const dbPath = resolveDbPath(env.DATABASE_URL);
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");
db.exec("PRAGMA synchronous = NORMAL");

const schema = readFileSync(resolve(__dirname, "schema.sql"), "utf8");
db.exec(schema);

logger.info({ path: dbPath }, "sqlite ready");

export type DB = DatabaseSync;
export type Stmt = StatementSync;
