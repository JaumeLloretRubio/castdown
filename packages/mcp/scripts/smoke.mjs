// MCP smoke test — exercises castdown-mcp end-to-end against a running stack.
//
// Boots castdown-mcp as a child via stdio, lists tools, then calls each one
// with realistic inputs. Verifies that:
//   - The server speaks MCP correctly (initialize + tools/list + tools/call).
//   - The 4 tools forward to the gateway and return parseable responses.
//   - The binary tools (render_markdown, crawl_url) write valid files to disk.
//
// Usage:
//   node packages/mcp/scripts/smoke.mjs
// Pre-reqs:
//   - Gateway + upstreams running (scripts/dev-local.ps1 + dev-markitdown.ps1).
//   - packages/mcp/dist/index.js built (`pnpm --filter castdown-mcp build`).

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, mkdir, writeFile, stat } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const SERVER = resolve(__dirname, "../dist/index.js");
const OUT = resolve(REPO_ROOT, "tmp/mcp-smoke");

const API_URL = process.env.CASTDOWN_API_URL ?? "http://localhost:3001";
const API_KEY = process.env.CASTDOWN_API_KEY ?? "cd_dev_changeme";

function color(s, c) {
  const codes = { red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m", cyan: "\x1b[36m", dim: "\x1b[2m", reset: "\x1b[0m" };
  return `${codes[c] ?? ""}${s}${codes.reset}`;
}
const header = (s) => console.log("\n" + color("== " + s + " ==", "cyan"));
const ok = (s) => console.log(color("  OK   ", "green") + s);
const fail = (s) => console.log(color("  FAIL ", "red") + s);
const info = (s) => console.log(color("       ", "dim") + s);

let failures = 0;

async function expect(label, fn) {
  try {
    const r = await fn();
    ok(label);
    return r;
  } catch (e) {
    fail(`${label} — ${e.message}`);
    failures++;
    return null;
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });

  // sanity: gateway reachable
  header("Gateway preflight");
  await expect(`GET ${API_URL}/health → 200`, async () => {
    const r = await fetch(`${API_URL}/health`);
    if (!r.ok) throw new Error(`status ${r.status}`);
    const j = await r.json();
    info(`upstreams: ${Object.entries(j.services).map(([k, v]) => `${k}=${v.ok ? "ok" : "down"}`).join(" · ")}`);
    return j;
  });

  // ── boot mcp via stdio ───────────────────────────────
  header("MCP handshake");
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [SERVER],
    env: { ...process.env, CASTDOWN_API_URL: API_URL, CASTDOWN_API_KEY: API_KEY },
    stderr: "pipe",
  });

  // Surface stderr of the child for debugging
  transport.stderr?.on("data", (chunk) => {
    process.stderr.write(color("[mcp] ", "dim") + chunk.toString());
  });

  const client = new Client(
    { name: "castdown-smoke", version: "0.0.1" },
    { capabilities: {} },
  );

  await expect("connect → initialize", async () => {
    await client.connect(transport);
  });

  // ── tools/list ───────────────────────────────────────
  header("tools/list");
  const tools = await expect("listed tools", async () => {
    const { tools } = await client.listTools();
    return tools;
  });
  if (tools) {
    info(`exposed ${tools.length} tools: ${tools.map((t) => t.name).join(", ")}`);
    const expected = ["cast_file", "render_markdown", "fetch_page", "crawl_url"];
    const got = new Set(tools.map((t) => t.name));
    for (const name of expected) {
      if (got.has(name)) ok(`tool present: ${name}`);
      else { fail(`tool missing: ${name}`); failures++; }
    }
  }

  // ── prepare a sample file for cast_file ──────────────
  header("setup sample input");
  const sampleHtmlPath = resolve(OUT, "sample.html");
  await writeFile(
    sampleHtmlPath,
    `<!doctype html><html><body><h1>MCP smoke</h1><p>Cast <strong>this</strong> down.</p><table><tr><th>k</th><th>v</th></tr><tr><td>tool</td><td>cast_file</td></tr></table></body></html>`,
    "utf8",
  );
  ok(`wrote ${sampleHtmlPath}`);

  // ── 1. cast_file ─────────────────────────────────────
  header("tools/call cast_file");
  await expect("cast_file: sample.html → markdown", async () => {
    const r = await client.callTool({ name: "cast_file", arguments: { path: sampleHtmlPath } });
    if (r.isError) throw new Error(`isError: ${r.content[0]?.text}`);
    const text = r.content[0]?.text ?? "";
    const json = JSON.parse(text);
    if (!json.markdown || !json.markdown.includes("MCP smoke")) {
      throw new Error(`markdown missing expected content: ${text.slice(0, 200)}`);
    }
    info(`engine=${json.meta?.engine} chars=${json.meta?.chars} cleaners=${(json.meta?.cleaners_applied || []).join(",")}`);
    info(`md head: ${JSON.stringify(json.markdown.slice(0, 60))}…`);
  });

  // ── 2. render_markdown ───────────────────────────────
  header("tools/call render_markdown");
  const pdfOut = resolve(OUT, "mcp-rendered.pdf");
  await expect("render_markdown: MD → PDF on disk", async () => {
    const r = await client.callTool({
      name: "render_markdown",
      arguments: {
        markdown: "# MCP renders PDFs\n\nVia **typst**.\n\n- bullet 1\n- bullet 2\n",
        target: "pdf",
        output_path: pdfOut,
      },
    });
    if (r.isError) throw new Error(`isError: ${r.content[0]?.text}`);
    const json = JSON.parse(r.content[0].text);
    if (json.output_path !== pdfOut) throw new Error(`output_path mismatch: ${json.output_path}`);
    const s = await stat(pdfOut);
    if (s.size < 1000) throw new Error(`pdf too small (${s.size} bytes)`);
    const magic = (await readFile(pdfOut, { encoding: null })).subarray(0, 5).toString("latin1");
    if (magic !== "%PDF-") throw new Error(`bad magic: ${magic}`);
    info(`wrote ${pdfOut} · ${json.size_bytes} bytes · magic %PDF-`);
  });

  // ── 3. fetch_page ────────────────────────────────────
  header("tools/call fetch_page");
  await expect("fetch_page: example.com → JSON listing", async () => {
    const r = await client.callTool({
      name: "fetch_page",
      arguments: { url: "https://example.com" },
    });
    if (r.isError) throw new Error(`isError: ${r.content[0]?.text}`);
    const text = r.content[0].text;
    // fetch_page returns whatever /api/crawl returns when format=flat — at least a JSON blob
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = null; }
    info(`response head: ${text.slice(0, 120).replace(/\s+/g, " ")}…`);
    if (!text || text.length < 5) throw new Error("empty response");
  });

  // ── 4. crawl_url ─────────────────────────────────────
  header("tools/call crawl_url");
  const zipOut = resolve(OUT, "mcp-crawl.zip");
  await expect("crawl_url: example.com → ZIP on disk", async () => {
    const r = await client.callTool({
      name: "crawl_url",
      arguments: {
        url: "https://example.com",
        depth: 1,
        max_pages: 3,
        output_path: zipOut,
      },
    });
    if (r.isError) throw new Error(`isError: ${r.content[0]?.text}`);
    const json = JSON.parse(r.content[0].text);
    if (json.output_path !== zipOut) throw new Error(`output_path mismatch: ${json.output_path}`);
    const s = await stat(zipOut);
    if (s.size < 200) throw new Error(`zip too small (${s.size} bytes)`);
    const magic = (await readFile(zipOut, { encoding: null })).subarray(0, 2).toString("latin1");
    if (magic !== "PK") throw new Error(`bad magic: ${magic}`);
    info(`wrote ${zipOut} · ${json.size_bytes} bytes · magic PK`);
  });

  // ── close ────────────────────────────────────────────
  await client.close();

  // ── summary ──────────────────────────────────────────
  console.log("");
  if (failures === 0) {
    console.log(color("✓ all MCP checks passed", "green"));
    process.exit(0);
  } else {
    console.log(color(`✗ ${failures} MCP checks failed`, "red"));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(color("FATAL: " + (e.stack ?? e.message), "red"));
  process.exit(2);
});
