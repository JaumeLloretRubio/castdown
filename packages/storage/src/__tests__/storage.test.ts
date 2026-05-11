import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStorage } from "../index.js";

describe("createStorage", () => {
  let root: string;
  beforeEach(async () => { root = await mkdtemp(join(tmpdir(), "castdown-storage-")); });
  afterEach(async () => { await rm(root, { recursive: true, force: true }); });

  it("writes content-addressed blob", async () => {
    const s = createStorage({ root });
    const ref = await s.write(Buffer.from("hello world"));
    expect(ref.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(ref.size).toBe(11);
    expect(ref.relativePath).toContain(ref.sha256);
  });

  it("dedupes identical content", async () => {
    const s = createStorage({ root });
    const a = await s.write(Buffer.from("same"));
    const b = await s.write(Buffer.from("same"));
    expect(a.path).toBe(b.path);
  });

  it("reads what it wrote", async () => {
    const s = createStorage({ root });
    const ref = await s.write(Buffer.from("payload"));
    const back = await s.read(ref.relativePath);
    expect(back.toString()).toBe("payload");
  });

  it("removes a blob", async () => {
    const s = createStorage({ root });
    const ref = await s.write(Buffer.from("delete me"));
    await s.remove(ref.relativePath);
    await expect(readFile(ref.path)).rejects.toThrow();
  });
});
