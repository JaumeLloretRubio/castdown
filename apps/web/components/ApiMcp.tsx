"use client";
import { useState } from "react";

type Tab = "curl" | "ts" | "py";

const TABS: { key: Tab; label: string }[] = [
  { key: "curl", label: "curl" },
  { key: "ts", label: "typescript" },
  { key: "py", label: "python" },
];

const SAMPLES: Record<Tab, string> = {
  curl: `# 1. Any file → markdown
curl -X POST http://localhost:3001/api/cast \\
  -H "X-API-Key: cd_dev_changeme" \\
  -F "file=@report.pdf"

# 2. Markdown → PDF (typst engine)
curl -X POST http://localhost:3001/api/cast \\
  -H "X-API-Key: cd_dev_changeme" \\
  -H "Content-Type: application/json" \\
  -d '{
    "markdown": "# Hello castdown",
    "target": "pdf"
  }' --output out.pdf

# 3. Recursive crawl + ZIP of .md
curl -X POST http://localhost:3001/api/crawl \\
  -H "X-API-Key: cd_dev_changeme" \\
  -H "Content-Type: application/json" \\
  -d '{ "url": "https://example.com", "depth": 2, "max_pages": 50 }' \\
  --output site.zip`,
  ts: `// npm i -D ts-node node-fetch form-data
const API = "http://localhost:3001";
const KEY = "cd_dev_changeme";

// 1. file → md
const fd = new FormData();
fd.append("file", await (await fetch("file:///c:/doc.pdf")).blob());
const res = await fetch(\`\${API}/api/cast\`, {
  method: "POST",
  headers: { "X-API-Key": KEY },
  body: fd,
});
const { markdown, meta } = await res.json();

// 2. md → pdf
const pdfRes = await fetch(\`\${API}/api/cast\`, {
  method: "POST",
  headers: { "X-API-Key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ markdown, target: "pdf" }),
});
const pdfBlob = await pdfRes.blob();

// 3. crawl
const zip = await fetch(\`\${API}/api/crawl\`, {
  method: "POST",
  headers: { "X-API-Key": KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ url: "https://docs.example.com", depth: 2 }),
}).then(r => r.blob());`,
  py: `# pip install httpx
import httpx

API = "http://localhost:3001"
KEY = "cd_dev_changeme"
H   = {"X-API-Key": KEY}

# 1. file → md
with open("report.pdf", "rb") as f:
    r = httpx.post(f"{API}/api/cast", headers=H, files={"file": f})
    md = r.json()["markdown"]

# 2. md → pdf
r = httpx.post(
    f"{API}/api/cast", headers={**H, "Content-Type": "application/json"},
    json={"markdown": md, "target": "pdf"},
)
open("out.pdf", "wb").write(r.content)

# 3. crawl
r = httpx.post(
    f"{API}/api/crawl", headers={**H, "Content-Type": "application/json"},
    json={"url": "https://docs.example.com", "depth": 2}, timeout=120,
)
open("site.zip", "wb").write(r.content)`,
};

const MCP_CONFIG = `{
  "mcpServers": {
    "castdown": {
      "command": "npx",
      "args": ["-y", "castdown-mcp"],
      "env": {
        "CASTDOWN_API_URL": "http://localhost:3001",
        "CASTDOWN_API_KEY": "cd_dev_changeme"
      }
    }
  }
}`;

const MCP_TOOLS = [
  { name: "cast_file",       desc: "* → .md from a local path" },
  { name: "render_markdown", desc: ".md → pdf/docx/html/pptx/epub" },
  { name: "fetch_page",      desc: "single URL → clean .md (Readability + Turndown)" },
  { name: "crawl_url",       desc: "URL → ZIP of linked .md with TOC" },
];

export function ApiMcp() {
  const [tab, setTab] = useState<Tab>("curl");
  const [copied, setCopied] = useState<"api" | "mcp" | null>(null);

  async function copy(text: string, which: "api" | "mcp") {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <section className="grid grid-cols-2 border-b-2 border-ink">
      {/* ── Left: HTTP API ──────────────────────────── */}
      <div id="api" className="border-r-2 border-ink scroll-mt-20">
        <div className="sec-head">
          <div className="num">04</div>
          <div className="ttl">rest api <span className="arr">·</span> http</div>
          <div className="right-meta">
            <span className="pill solid">self-host</span>
          </div>
        </div>

        <div className="flex border-b-2 border-ink">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                "px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider cursor-pointer border-r-2 border-ink " +
                (tab === t.key ? "bg-ink text-bg" : "bg-bg hover:bg-paper")
              }
            >
              {t.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => copy(SAMPLES[tab], "api")}
            className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider border-l-2 border-ink hover:bg-ink hover:text-bg"
          >
            {copied === "api" ? "copied ✓" : "copy"}
          </button>
        </div>

        <pre className="px-4 py-3.5 text-[12px] leading-[1.65] whitespace-pre overflow-auto bg-paper m-0 min-h-[260px]">
{SAMPLES[tab]}
        </pre>
      </div>

      {/* ── Right: MCP Server ───────────────────────── */}
      <div id="mcp" className="scroll-mt-20">
        <div className="sec-head">
          <div className="num">05</div>
          <div className="ttl">mcp server <span className="arr">·</span> agents</div>
          <div className="right-meta">
            <span className="pill solid">stdio</span>
            <span className="pill">claude · cursor · windsurf</span>
          </div>
        </div>

        <div className="px-4 py-3 border-b-2 border-ink">
          <div className="text-[11px] uppercase tracking-wider font-bold mb-1.5 text-mute">// claude_desktop_config.json</div>
          <div className="flex items-start gap-3">
            <pre className="text-[12px] leading-[1.55] whitespace-pre overflow-auto bg-paper border-2 border-ink p-2.5 flex-1 m-0">
{MCP_CONFIG}
            </pre>
            <button
              onClick={() => copy(MCP_CONFIG, "mcp")}
              className="btn text-[10px] py-2 min-w-0 px-2"
            >
              {copied === "mcp" ? "✓" : "copy"}
            </button>
          </div>
        </div>

        <div className="px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider font-bold mb-2 text-mute">// exposed tools</div>
          {MCP_TOOLS.map((t) => (
            <div key={t.name} className="grid grid-cols-[140px_1fr] gap-2 py-1 border-b border-[rgba(11,11,11,0.18)] last:border-b-0 text-[12px]">
              <span className="font-bold tabular-nums">{t.name}</span>
              <span className="text-mute">{t.desc}</span>
            </div>
          ))}
          <div className="mt-3 text-[10px] uppercase tracking-wider text-mute">
            install: <code className="font-bold text-ink">npx -y castdown-mcp</code>
          </div>
        </div>
      </div>
    </section>
  );
}
