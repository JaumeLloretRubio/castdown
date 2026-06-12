"use client";
import { useState } from "react";

interface Pkg {
  name: string;
  registry: string;
  license: string;
  install: string;
  desc: string;
  npm: string;
  exports: string[];
}

const PACKAGES: Pkg[] = [
  {
    name: "castdown-mcp",
    registry: "npm",
    license: "MIT",
    install: "npx -y castdown-mcp",
    desc: "MCP server — cast files & URLs to Markdown from any MCP client (Claude Desktop, Cursor, Windsurf, Zed).",
    npm: "https://www.npmjs.com/package/castdown-mcp",
    exports: ["cast_file", "render_markdown", "fetch_page", "crawl_url"],
  },
  {
    name: "@castdown/cleaners",
    registry: "npm",
    license: "Apache-2.0",
    install: "npm i @castdown/cleaners",
    desc: "Composable Markdown post-processing pipeline. Dirty parser output in, clean GFM out. Every pass is named and skippable.",
    npm: "https://www.npmjs.com/package/@castdown/cleaners",
    exports: ["clean()", "29 regex + remark passes"],
  },
];

export function Packages() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1200);
  }

  return (
    <section id="packages" className="border-b-2 border-ink scroll-mt-20">
      <div className="sec-head">
        <div className="num">06</div>
        <div className="ttl">packages <span className="arr">·</span> npm</div>
        <div className="right-meta">
          <span className="pill solid">published</span>
          <span className="pill">open source</span>
        </div>
      </div>

      <div className="grid grid-cols-2">
        {PACKAGES.map((p, i) => (
          <div
            key={p.name}
            className={"px-4 py-4 flex flex-col " + (i === 0 ? "border-r-2 border-ink" : "")}
          >
            <div className="flex items-center justify-between mb-2">
              <code className="text-[15px] font-extrabold tracking-tight text-ink break-all">{p.name}</code>
              <span className="pill shrink-0 ml-2">{p.license}</span>
            </div>

            <p className="m-0 mb-3 text-[12px] leading-[1.55] text-mute">{p.desc}</p>

            <div className="flex items-stretch gap-2 mb-3">
              <code className="flex-1 text-[12px] font-bold bg-paper border-2 border-ink px-2.5 py-2 overflow-auto whitespace-pre">
                $ {p.install}
              </code>
              <button
                onClick={() => copy(p.install)}
                className="btn text-[10px] py-2 min-w-0 px-2.5"
              >
                {copied === p.install ? "✓" : "copy"}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {p.exports.map((e) => (
                <span key={e} className="pill tabular-nums">{e}</span>
              ))}
            </div>

            <a
              href={p.npm}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto text-[10px] uppercase tracking-wider font-bold text-ink underline underline-offset-2 hover:bg-ink hover:text-bg w-fit"
            >
              view on npm →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
