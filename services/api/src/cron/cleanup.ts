/**
 * TTL cleanup: every 10 minutes, remove file rows whose expires_at has passed
 * and delete the corresponding blob from disk.
 *
 * Multiple file rows may point at the same content-addressed blob — we only
 * unlink the blob when no remaining row references it.
 */
import { createStorage } from "@castdown/storage";
import { db } from "../db/index.js";
import { listExpiredFiles, removeFileRecord } from "../db/repo.js";
import { env } from "../env.js";
import { logger } from "../logger.js";

const TICK_MS = 10 * 60 * 1000;

const refsBySha = db.prepare(
  `SELECT COUNT(*) AS n FROM files WHERE sha256 = ?`,
);

export function startCleanupCron(): void {
  const storage = createStorage({ root: env.STORAGE_PATH });

  async function tick() {
    try {
      const expired = listExpiredFiles();
      if (expired.length === 0) return;

      let removedBlobs = 0;
      for (const f of expired) {
        removeFileRecord(f.id);
        const remaining = refsBySha.get(f.sha256) as { n: number } | undefined;
        if ((remaining?.n ?? 0) === 0) {
          await storage.remove(f.path).catch(() => {});
          removedBlobs++;
        }
      }
      logger.info({ rows: expired.length, blobs: removedBlobs }, "cleanup_tick");
    } catch (err) {
      logger.error({ err }, "cleanup_failed");
    }
  }

  // Fire once at startup, then on interval. Don't await — non-blocking.
  void tick();
  setInterval(tick, TICK_MS).unref();
}
