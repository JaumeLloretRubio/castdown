/**
 * Filesystem-backed blob storage.
 *
 * Layout under STORAGE_PATH/:
 *   blobs/<sha256[0:2]>/<sha256[2:4]>/<sha256>
 *   tmp/<random>
 *
 * Files are content-addressed by sha256 — duplicate uploads dedupe naturally.
 * TTL/expiry is tracked in the SQLite `files` table, not on disk.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

export interface StorageOpts {
  root: string;
}

export interface BlobRef {
  sha256: string;
  path: string;        // absolute on disk
  relativePath: string; // relative to root (what goes in DB)
  size: number;
}

export function createStorage(opts: StorageOpts) {
  const root = opts.root;

  async function ensureRoot(): Promise<void> {
    if (!existsSync(root)) await mkdir(root, { recursive: true });
    if (!existsSync(join(root, "blobs"))) await mkdir(join(root, "blobs"), { recursive: true });
    if (!existsSync(join(root, "tmp"))) await mkdir(join(root, "tmp"), { recursive: true });
  }

  async function write(data: Buffer | Uint8Array): Promise<BlobRef> {
    await ensureRoot();
    const sha = createHash("sha256").update(data).digest("hex");
    const rel = join("blobs", sha.slice(0, 2), sha.slice(2, 4), sha);
    const abs = join(root, rel);
    if (!existsSync(abs)) {
      await mkdir(dirname(abs), { recursive: true });
      // Write to tmp first, then rename — atomic
      const tmp = join(root, "tmp", randomBytes(12).toString("hex"));
      await writeFile(tmp, data);
      await rename(tmp, abs);
    }
    return { sha256: sha, path: abs, relativePath: rel, size: data.length };
  }

  async function read(relPath: string): Promise<Buffer> {
    return readFile(join(root, relPath));
  }

  async function remove(relPath: string): Promise<void> {
    await rm(join(root, relPath), { force: true });
  }

  async function size(relPath: string): Promise<number> {
    const s = await stat(join(root, relPath));
    return s.size;
  }

  return { write, read, remove, size, root };
}

export type Storage = ReturnType<typeof createStorage>;
