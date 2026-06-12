"use client";
import { useEffect, useRef, useState } from "react";
import { crawl } from "../lib/api";
import { log } from "../lib/activity";
import { inspectZip } from "../lib/zipTree";

export function Crawler() {
  const [url, setUrl] = useState("https://example.com");
  const [depth, setDepth] = useState(1);
  const [maxPages, setMaxPages] = useState(5);
  const [busy, setBusy] = useState(false);
  const [tree, setTree] = useState<string>("");
  const [stats, setStats] = useState<{ pages: number; bytes: number; ms: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastBlob, setLastBlob] = useState<{ blob: Blob; name: string } | null>(null);
  const treeRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (treeRef.current && tree) treeRef.current.scrollTop = treeRef.current.scrollHeight;
  }, [tree]);

  async function run() {
    if (!url) return;
    setBusy(true); setErr(null); setTree(""); setStats(null); setLastBlob(null);
    log("inf", `POST /api/crawl · ${url} · depth=${depth} max=${maxPages}`);
    const t0 = Date.now();
    try {
      const blob = await crawl(url, depth, maxPages);
      const ms = Date.now() - t0;
      let name = "crawl.zip";
      try { name = new URL(url).hostname + ".zip"; } catch {}
      setLastBlob({ blob, name });

      log("inf", `INSPECT ZIP · ${(blob.size / 1024).toFixed(1)} KB`);
      const summary = await inspectZip(blob);
      setTree(summary.tree);
      setStats({ pages: summary.fileCount, bytes: blob.size, ms });
      log("ok", `CRAWL OK · ${summary.fileCount} files · ${(blob.size / 1024).toFixed(1)} KB · ${ms}ms`);
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg);
      log("err", `CRAWL FAIL · ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!lastBlob) return;
    const dlUrl = URL.createObjectURL(lastBlob.blob);
    const a = document.createElement("a");
    a.href = dlUrl;
    a.download = lastBlob.name;
    a.click();
    URL.revokeObjectURL(dlUrl);
    log("inf", `DOWNLOAD · ${lastBlob.name}`);
  }

  return (
    <section className="border-b-2 border-ink">
      <div className="sec-head">
        <div className="num">03</div>
        <div className="ttl">url <span className="arr">→</span> .md tree</div>
        <div className="right-meta"><span className="pill solid">POST /api/crawl</span></div>
      </div>

      <div className="grid grid-cols-[70px_1fr_130px_130px] border-b-2 border-ink h-[50px]">
        <div className="bg-ink text-bg flex items-center justify-center font-extrabold text-[11px] uppercase">URL</div>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.example.com"
          className="border-0 px-3.5 font-mono text-[14px] font-semibold outline-none bg-transparent text-ink border-r-2 border-ink"
        />
        <div className="flex items-center justify-between px-3 border-r-2 border-ink uppercase text-[11px] font-semibold">
          <span>DEPTH</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setDepth((d) => Math.max(1, d - 1))} className="w-5 h-5 border-2 border-ink hover:bg-ink hover:text-bg">−</button>
            <span className="tabular-nums w-6 text-center">{depth}</span>
            <button onClick={() => setDepth((d) => Math.min(5, d + 1))} className="w-5 h-5 border-2 border-ink hover:bg-ink hover:text-bg">+</button>
          </div>
        </div>
        <div className="flex items-center justify-between px-3 uppercase text-[11px] font-semibold">
          <span>MAX</span>
          <input
            type="number"
            min={1}
            max={500}
            value={maxPages}
            onChange={(e) => setMaxPages(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
            className="w-12 border-2 border-ink px-1 text-right tabular-nums"
          />
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] min-h-[320px]">
        <pre ref={treeRef} className="px-4 py-3.5 text-[12px] leading-[1.55] whitespace-pre overflow-auto bg-paper border-r-2 border-ink m-0">
{tree || (busy ? "crawling…\n" : "// result will appear here after crawling\n// e.g.\ndocs/\n├── index.md\n├── getting-started.md\n└── api/\n    ├── auth.md\n    └── endpoints.md\n")}
        </pre>
        <div className="px-4 py-3.5 flex flex-col gap-2.5 text-[11px]">
          <div className="uppercase font-bold text-[11px] -mb-1">// status</div>
          <div className="grid grid-cols-[1fr_auto] py-1 border-b border-[rgba(11,11,11,0.18)]">
            <span className="text-mute uppercase">state</span>
            <span className={"font-extrabold " + (busy ? "text-red" : stats ? "text-ink" : "text-mute")}>
              {busy ? "● CRAWLING" : stats ? "✓ DONE" : "○ IDLE"}
            </span>
          </div>
          <Gauge k="files in zip" v={stats?.pages ?? 0} max={Math.max(stats?.pages ?? maxPages, 1)} />
          <Gauge k="zip bytes" v={stats?.bytes ?? 0} max={Math.max(stats?.bytes ?? 1, 1)} fmt={(n) => (n / 1024).toFixed(1) + " KB"} />
          <div className="grid grid-cols-[1fr_auto] border-b border-[rgba(11,11,11,0.18)] py-1">
            <span className="text-mute uppercase">elapsed</span>
            <span className="font-extrabold tabular-nums">{stats ? `${stats.ms}ms` : "—"}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] border-b border-[rgba(11,11,11,0.18)] py-1">
            <span className="text-mute uppercase">depth</span>
            <span className="font-extrabold tabular-nums">{depth}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] border-b border-[rgba(11,11,11,0.18)] py-1">
            <span className="text-mute uppercase">render js</span>
            <span className="font-extrabold">on</span>
          </div>
          {err && <div className="text-red font-bold mt-1 text-[11px] leading-snug break-words">ERR: {err}</div>}
          <div className="mt-auto flex flex-col gap-1.5">
            <button className="btn primary" onClick={run} disabled={busy || !url}>
              {busy ? "CRAWLING…" : "↳ CRAWL"}
            </button>
            <button className="btn" onClick={download} disabled={!lastBlob || busy}>
              ↓ DOWNLOAD .ZIP
            </button>
            <div className="text-[10px] uppercase tracking-wider text-mute text-center">
              internal links preserved as <b>[ ](./path.md)</b>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Gauge({ k, v, max, fmt }: { k: string; v: number; max: number; fmt?: (n: number) => string }) {
  const pct = Math.min(100, Math.round((v / Math.max(max, 1)) * 100));
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto] py-1 border-b border-[rgba(11,11,11,0.18)]">
        <span className="text-mute uppercase">{k}</span>
        <span className="font-extrabold tabular-nums">{fmt ? fmt(v) : v}</span>
      </div>
      <div className="h-3.5 border-2 border-ink relative mt-0.5 bg-white">
        <div className="absolute left-0 top-0 bottom-0 bg-ink" style={{ width: pct + "%" }} />
      </div>
    </div>
  );
}
