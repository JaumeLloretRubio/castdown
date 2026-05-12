"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { renderMd, getTemplates, type TemplateEntry } from "../lib/api";
import { analyzeTablesForTemplate, type TableWarning } from "../lib/tableAnalysis";
import { log } from "../lib/activity";

// Targets que el browser puede previsualizar inline (iframe).
const PREVIEWABLE = new Set(["pdf", "html"]);

const MAX_MD_BYTES = 50 * 1024 * 1024; // 50 MB, mismo limite que ToMd

const OUT_FORMATS = [
  { ext: "PDF",  sub: "typst" },
  { ext: "TEX",  sub: "latex" },
  { ext: "DOCX", sub: "pandoc" },
  { ext: "PPTX", sub: "marp" },
  { ext: "HTML", sub: "standalone" },
  { ext: "EPUB", sub: "e-reader" },
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [md, setMd] = useState(SAMPLE_MD);
  const [out, setOut] = useState<typeof OUT_FORMATS[number]["ext"]>("PDF");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const [tplMap, setTplMap] = useState<Record<string, TemplateEntry[]>>({});
  const [template, setTemplate] = useState<string | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const lines = md.split("\n").length;
  const words = md.trim().split(/\s+/).filter(Boolean).length;

  // Warning preventivo: detecta tablas que probablemente fallen con el template
  // actual antes de gastar el render. Solo aplica a PDF.
  const tableWarning: TableWarning | null = useMemo(
    () => analyzeTablesForTemplate(md, template, out.toLowerCase()),
    [md, template, out],
  );

  // Limpia el preview blob URL al desmontar o cambiar.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Cargar templates al montar.
  useEffect(() => {
    getTemplates()
      .then((r) => setTplMap(r.templates ?? {}))
      .catch((e) => log("err", `templates fetch fail · ${(e as Error).message}`));
  }, []);

  const availableTemplates = useMemo<TemplateEntry[]>(
    () => tplMap[out.toLowerCase()] ?? [],
    [tplMap, out],
  );

  // Al cambiar de target, seleccionar el default del nuevo target (si existe).
  useEffect(() => {
    const def = availableTemplates.find((t) => t.isDefault) ?? availableTemplates[0];
    setTemplate(def?.name);
  }, [availableTemplates]);

  async function loadFile(f?: File | null) {
    if (!f) return;
    const lower = f.name.toLowerCase();
    const okExt = lower.endsWith(".md") || lower.endsWith(".markdown") || lower.endsWith(".mdx") || lower.endsWith(".txt");
    const okType = !f.type || f.type.startsWith("text/");
    if (!okExt && !okType) {
      setErr(`Archivo no soportado: ${f.name}`);
      log("err", `FromMd reject · ${f.name} · ${f.type || "no-mime"}`);
      return;
    }
    if (f.size > MAX_MD_BYTES) {
      setErr(`Archivo > 50 MB`);
      return;
    }
    try {
      const text = await f.text();
      setMd(text);
      setDone(false);
      setErr(null);
      setLoadedName(f.name);
      log("inf", `FromMd load · ${f.name} · ${(f.size/1024).toFixed(1)} KB`);
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  async function convert() {
    setBusy(true); setDone(false); setErr(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);

    const tgt = out.toLowerCase();
    log("inf", `POST /api/cast · md → ${tgt}${template ? ` · tpl=${template}` : ""} · ${lines} líneas`);
    try {
      const blob = await renderMd(md, tgt, template);
      const url = URL.createObjectURL(blob);

      if (PREVIEWABLE.has(tgt)) {
        // Mostrar preview inline; descarga se hace desde el panel preview.
        setPreviewUrl(url);
        setDone(true);
      } else {
        // Formatos no-previewables (tex, docx, pptx, epub): descarga directa.
        const a = document.createElement("a");
        a.href = url;
        a.download = `document.${tgt}`;
        a.click();
        URL.revokeObjectURL(url);
        setDone(true);
      }
      log("ok", `RENDER OK · md → ${tgt} · ${(blob.size / 1024).toFixed(1)} KB`);
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg);
      log("err", `RENDER FAIL · ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  function downloadFromPreview() {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `document.${out.toLowerCase()}`;
    a.click();
    log("inf", `download · ${a.download}`);
  }

  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDone(false);
  }

  return (
    <div className="border-b-2 border-ink">
      <div className="sec-head">
        <div className="num">02</div>
        <div className="ttl">.md <span className="arr">→</span> cualquier formato</div>
        <div className="right-meta"><span className="pill solid">POST /api/cast</span></div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); loadFile(e.dataTransfer.files[0]); }}
        className={
          "relative m-3.5 border-2 bg-white grid grid-cols-[32px_1fr] grid-rows-1 transition-colors overflow-hidden " +
          (over ? "border-red" : "border-ink")
        }
        style={{ height: 320 }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,.mdx,.txt,text/markdown,text/plain"
          className="hidden"
          onChange={(e) => loadFile(e.target.files?.[0])}
        />
        <div className="bg-paper border-r-2 border-ink py-2 px-1.5 text-mute text-[11px] text-right tabular-nums select-none overflow-hidden">
          {Array.from({ length: Math.max(lines, 14) }).map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea
          spellCheck={false}
          value={md}
          onChange={(e) => { setMd(e.target.value); setDone(false); setLoadedName(null); }}
          className="border-0 resize-none outline-none p-2 px-2.5 font-mono text-[13px] leading-[1.55] bg-white text-ink w-full h-full overflow-auto focus:bg-[#fffef0]"
        />
        {over && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-ink/85 text-bg uppercase font-extrabold tracking-wider text-[14px]">
            suelta tu .md aquí
          </div>
        )}
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

      <div className="grid grid-cols-[auto_1fr] border-t-2 border-ink items-center">
        <div className="px-3 py-2 text-[11px] uppercase tracking-wider font-bold border-r-2 border-ink whitespace-nowrap">
          template
        </div>
        <div className="px-3 py-1.5 flex items-center gap-2">
          {availableTemplates.length === 0 ? (
            <span className="text-[11px] text-mute italic">— sin templates para .{out.toLowerCase()} (pandoc default)</span>
          ) : (
            <>
              <select
                value={template ?? ""}
                onChange={(e) => { setTemplate(e.target.value || undefined); setDone(false); }}
                className="bg-bg border-2 border-ink px-2 py-1 text-[12px] font-bold uppercase tracking-wide cursor-pointer focus:outline-none focus:bg-[#fffef0]"
              >
                {availableTemplates.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}{t.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-mute">{availableTemplates.length} disponible{availableTemplates.length === 1 ? "" : "s"}</span>
            </>
          )}
        </div>
      </div>

      {tableWarning && (
        <div
          className={
            "border-t-2 border-ink px-3 py-2 text-[11px] font-bold uppercase tracking-wider flex flex-wrap items-center gap-x-3 gap-y-1 " +
            (tableWarning.level === "severe"
              ? "bg-yellow-200 text-ink border-b-2"
              : "bg-paper text-ink")
          }
        >
          <span>
            {tableWarning.level === "severe" ? "⚠ tablas" : "ℹ tablas"} · {tableWarning.message}
          </span>
          {tableWarning.suggestion && (
            <button
              onClick={() => setTemplate(tableWarning.suggestion)}
              className="bg-ink text-bg px-2 py-0.5 hover:bg-red hover:text-bg transition-colors"
            >
              usar &quot;{tableWarning.suggestion}&quot; →
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] border-t-2 border-ink">
        <div className="min-w-0 px-3 py-2.5 text-[11px] text-mute border-r-2 border-ink flex items-center gap-1 whitespace-nowrap overflow-hidden">
          <span className="text-mute">lines:</span><b>{lines}</b>
          <span className="text-mute">·</span>
          <span className="text-mute">words:</span><b>{words}</b>
          <span className="text-mute">·</span>
          <span className="text-mute">target:</span><b>.{out.toLowerCase()}</b>
          {loadedName && (
            <span className="ml-2 text-ink truncate min-w-0">src: <b>{loadedName}</b></span>
          )}
          {done && !previewUrl && <span className="ml-2 bg-ink text-bg px-1.5">READY</span>}
        </div>
        <button className="btn shrink-0" onClick={() => fileRef.current?.click()}>Load .md</button>
        <button className="btn shrink-0" onClick={() => { setMd(SAMPLE_MD); setDone(false); setLoadedName(null); }}>Sample</button>
        <button className="btn primary shrink-0" onClick={convert} disabled={busy}>
          {busy ? "RENDERING…" : PREVIEWABLE.has(out.toLowerCase()) ? `PREVIEW → .${out.toLowerCase()}` : `RENDER → .${out.toLowerCase()}`}
        </button>
      </div>

      {previewUrl && (
        <div className="border-t-2 border-ink bg-paper">
          <div className="px-3 py-2 flex items-center gap-3 border-b-2 border-ink">
            <span className="text-[11px] uppercase tracking-wider font-bold">preview · .{out.toLowerCase()}</span>
            <span className="text-[10px] text-mute">{template ? `tpl=${template}` : ""}</span>
            <span className="flex-1" />
            <button className="btn primary shrink-0" onClick={downloadFromPreview}>
              ↓ Download .{out.toLowerCase()}
            </button>
            <button className="btn shrink-0" onClick={closePreview}>Close</button>
          </div>
          <iframe
            src={previewUrl}
            title={`preview-${out.toLowerCase()}`}
            className="w-full bg-white"
            style={{ height: 720, border: 0 }}
          />
        </div>
      )}

      {err && (
        <div className="border-t-2 border-ink bg-red text-bg px-3 py-2 text-[11px] font-bold uppercase tracking-wider break-words">
          ERR: {err}
        </div>
      )}
    </div>
  );
}
