#!/usr/bin/env node
/**
 * castdown-mcp — MCP server bridging a client (Claude Desktop, Cursor, etc.)
 * to a running castdown API gateway.
 *
 * Communicates over stdio. The MCP client spawns this process via
 *   { "command": "npx", "args": ["-y", "castdown-mcp"], "env": { ... } }
 *
 * Tools exposed: cast_file, fetch_page, crawl_url, render_markdown.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { z } from "zod";

const API_URL = (process.env.CASTDOWN_API_URL ?? "http://localhost:3001").replace(/\/$/, "");
const API_KEY = process.env.CASTDOWN_API_KEY ?? "";

function logErr(msg: string): void {
  // MCP stdio: stderr only — never stdout (that channel is the protocol)
  process.stderr.write(`[castdown-mcp] ${msg}\n`);
}

if (!API_KEY) logErr("warning: CASTDOWN_API_KEY not set");

// ── Tool definitions ────────────────────────────────────────────
const TOOLS = [
  {
    name: "cast_file",
    description:
      "Convert a local file (PDF, DOCX, PPTX, XLSX, HTML, EPUB, image, audio, ...) to clean Markdown. " +
      "Returns the Markdown text plus metadata.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute path to the file on this machine" },
        skip_cleaners: {
          type: "string",
          description: "Comma-separated cleaner names to skip (e.g. 'fixTables,detectToc')",
        },
        raw: { type: "boolean", description: "If true, return raw parser output without cleaning" },
      },
      required: ["path"],
    },
  },
  {
    name: "render_markdown",
    description:
      "Render a Markdown string to PDF, DOCX, HTML, PPTX, or EPUB. Returns the output path on disk.",
    inputSchema: {
      type: "object",
      properties: {
        markdown: { type: "string", description: "Markdown source" },
        target: { type: "string", enum: ["pdf", "docx", "html", "pptx", "epub"] },
        template: { type: "string", description: "Template name (optional)" },
        output_path: { type: "string", description: "Absolute path for output (optional, default: temp dir)" },
      },
      required: ["markdown", "target"],
    },
  },
  {
    name: "fetch_page",
    description:
      "Fetch a single URL, extract main content, return as Markdown. Renders JavaScript-driven SPAs.",
    inputSchema: {
      type: "object",
      properties: { url: { type: "string", description: "URL to fetch" } },
      required: ["url"],
    },
  },
  {
    name: "crawl_url",
    description:
      "Crawl a website recursively. Returns a ZIP of linked `.md` files (saved to output_path) " +
      "and the list of pages with their relative paths. Internal links are rewritten to relative .md paths.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "Root URL to crawl" },
        depth: { type: "number", description: "Max crawl depth (default 2, max 5)" },
        max_pages: { type: "number", description: "Max pages (default 50, max 500)" },
        output_path: { type: "string", description: "Where to save the ZIP (default: temp dir)" },
      },
      required: ["url"],
    },
  },
];

// ── Server bootstrap ────────────────────────────────────────────
const server = new Server(
  { name: "castdown-mcp", version: "0.1.0-alpha" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    switch (name) {
      case "cast_file":       return textResult(await callCastFile(args));
      case "render_markdown": return textResult(await callRenderMd(args));
      case "fetch_page":      return textResult(await callFetchPage(args));
      case "crawl_url":       return textResult(await callCrawl(args));
      default:                return textResult({ error: `unknown_tool: ${name}` }, true);
    }
  } catch (e) {
    return textResult({ error: (e as Error).message }, true);
  }
});

function textResult(payload: unknown, isError = false): { content: { type: "text"; text: string }[]; isError?: boolean } {
  return {
    content: [{ type: "text", text: typeof payload === "string" ? payload : JSON.stringify(payload, null, 2) }],
    ...(isError ? { isError: true } : {}),
  };
}

// ── Tool implementations ────────────────────────────────────────
async function callCastFile(args: unknown) {
  const a = z.object({
    path: z.string(),
    skip_cleaners: z.string().optional(),
    raw: z.boolean().optional(),
  }).parse(args);

  const data = await readFile(resolve(a.path));
  const fd = new FormData();
  fd.append("file", new Blob([data]), basename(a.path));

  const params = new URLSearchParams();
  if (a.skip_cleaners) params.set("skip_cleaners", a.skip_cleaners);
  if (a.raw) params.set("raw", "1");

  const res = await api(`/api/cast${params.toString() ? "?" + params : ""}`, { method: "POST", body: fd });
  const json = await res.json() as { markdown: string; meta: Record<string, unknown> };
  return {
    markdown: json.markdown,
    meta: json.meta,
  };
}

async function callRenderMd(args: unknown) {
  const a = z.object({
    markdown: z.string().min(1),
    target: z.enum(["pdf", "docx", "html", "pptx", "epub"]),
    template: z.string().optional(),
    output_path: z.string().optional(),
  }).parse(args);

  const res = await api("/api/cast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown: a.markdown, target: a.target, template: a.template }),
  });
  const buf = Buffer.from(await res.arrayBuffer());

  const out = a.output_path ?? `/tmp/castdown-${Date.now()}.${a.target}`;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, buf);

  return { output_path: out, size_bytes: buf.length, target: a.target };
}

async function callFetchPage(args: unknown) {
  const a = z.object({ url: z.string().url() }).parse(args);
  const res = await api("/api/crawl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: a.url, depth: 1, max_pages: 1, format: "flat" }),
  });
  return await res.json();
}

async function callCrawl(args: unknown) {
  const a = z.object({
    url: z.string().url(),
    depth: z.number().int().min(1).max(5).default(2),
    max_pages: z.number().int().min(1).max(500).default(50),
    output_path: z.string().optional(),
  }).parse(args);

  const res = await api("/api/crawl", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: a.url, depth: a.depth, max_pages: a.max_pages, format: "zip" }),
  });
  const buf = Buffer.from(await res.arrayBuffer());

  const host = (() => { try { return new URL(a.url).hostname; } catch { return "crawl"; } })();
  const out = a.output_path ?? `/tmp/castdown-${host}-${Date.now()}.zip`;
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, buf);
  return { output_path: out, size_bytes: buf.length, root_url: a.url };
}

// ── HTTP helper ─────────────────────────────────────────────────
async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (API_KEY) headers.set("X-API-Key", API_KEY);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`castdown api ${res.status}: ${body.slice(0, 200)}`);
  }
  return res;
}

// ── Start ───────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
logErr(`listening on stdio · api=${API_URL}`);
