"use client";
import { useState } from "react";
import { renderMd } from "../lib/api";
import { log } from "../lib/activity";

const OUT_FORMATS = [
  { ext: "PDF",  sub: "typst" },
  { ext: "DOCX", sub: "pandoc" },
  { ext: "PPTX", sub: "marp" },
  { ext: "HTML", sub: "standalone" },
  { ext: "EPUB", sub: "e-reader" },
  { ext: "XLSX", sub: "WIP" },
];

const SAMPLE_MD = `# Reporte Q3 — Operaciones

Resumen ejecutivo del trimestre. **Crecimiento interanual** del 23 %, con foco en la
expansión EU.

## Hitos
1. Lanzamiento de la API pública
2. Integración MCP con Claude, Cursor y Windsurf
3. Self-hosting via Docker

## Métricas

| KPI            | Q2     | Q3     | Δ      |
|----------------|--------|--------|--------|
| Conversiones   | 84,210 | 142,580| +69 %  |
| API keys       | 412    | 1,031  | +150 % |
| Pages crawled  | 1.2 M  | 3.8 M  | +217 % |

> Las conversiones de PDF dominaron el trimestre con un **62 %** del total.
`;

export function FromMd() {
  const [md, setMd] = useState(SAMPLE_MD);
  const [out, setOut] = useState<typeof OUT_FORMATS[number]["ext"]>("PDF");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lines = md.split("\n").length;
  const words = md.trim().split(/\s+/).filter(Boolean).length;

  async function convert() {
    setBusy(true); setDone(false); setErr(null);
    log("inf", `POST /api/cast · md → ${out.toLowerCase()} · ${lines} líneas`);
    try {
      const blob = await renderMd(md, out.toLowerCase());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document.${out.toLowerCase()}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      log("ok", `RENDER OK · md → ${out.toLowerCase()} · ${(blob.size / 1024).toFixed(1)} KB`);
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg);
      log("err", `RENDER FAIL · ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b-2 border-ink">
      <div className="sec-head">
        <div className="num">02</div>
        <div className="ttl">.md <span className="arr">→</span> cualquier formato</div>
        <div className="right-meta"><span className="pill solid">POST /api/cast</span></div>
      </div>

      <div className="m-3.5 border-2 border-ink min-h-[240px] bg-white grid grid-cols-[32px_1fr]">
        <div className="bg-paper border-r-2 border-ink py-2 px-1.5 text-mute text-[11px] text-right tabular-nums select-none">
          {Array.from({ length: Math.max(lines, 14) }).map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea
          spellCheck={false}
          value={md}
          onChange={(e) => { setMd(e.target.value); setDone(false); }}
          className="border-0 resize-none outline-none p-2 px-2.5 font-mono text-[13px] leading-[1.55] bg-white text-ink w-full focus:bg-[#fffef0]"
        />
      </div>

      <div className="grid grid-cols-6 border-t-2 border-ink">
        {OUT_FORMATS.map((f) => (
          <div
            key={f.ext}
            onClick={() => { setOut(f.ext); setDone(false); }}
            className={
              "px-2 py-2.5 border-r-2 border-ink last:border-r-0 text-[11px] font-bold text-center uppercase cursor-pointer bg-bg hover:bg-ink hover:text-bg " +
              (out === f.ext ? "bg-ink text-bg shadow-[inset_0_-3px_0_0_var(--red)]" : "")
            }
          >
            <div>{f.ext}</div>
            <span className={"block font-medium text-[10px] " + (out === f.ext ? "text-bg opacity-65" : "text-mute")}>{f.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto_auto] border-t-2 border-ink">
        <div className="px-3 py-2.5 text-[11px] text-mute border-r-2 border-ink flex items-center">
          <span className="text-mute">lines:</span>&nbsp;<b>{lines}</b>&nbsp;·&nbsp;
          <span className="text-mute">words:</span>&nbsp;<b>{words}</b>&nbsp;·&nbsp;
          <span className="text-mute">target:</span>&nbsp;<b>.{out.toLowerCase()}</b>
          {done && <span className="ml-2 bg-ink text-bg px-1.5">READY</span>}
          {err && <span className="ml-2 text-red font-bold">ERR: {err}</span>}
        </div>
        <button className="btn" onClick={() => { setMd(SAMPLE_MD); setDone(false); }}>Sample</button>
        <button className="btn primary" onClick={convert} disabled={busy}>
          {busy ? "RENDERING…" : `RENDER → .${out.toLowerCase()}`}
        </button>
      </div>
    </div>
  );
}
