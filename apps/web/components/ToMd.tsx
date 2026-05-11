"use client";
import { useRef, useState } from "react";
import { castFile } from "../lib/api";
import { log } from "../lib/activity";

const IN_FORMATS = [
  { ext: "PDF",  sub: "document"   },
  { ext: "DOCX", sub: "word"       },
  { ext: "PPTX", sub: "slides"     },
  { ext: "XLSX", sub: "sheet"      },
  { ext: "EPUB", sub: "e-book"     },
  { ext: "HTML", sub: "web"        },
  { ext: "PNG",  sub: "ocr"        },
  { ext: "WAV",  sub: "whisper"    },
  { ext: "CSV",  sub: "table"      },
  { ext: "RST",  sub: "docs"       },
  { ext: "ODT",  sub: "openoffice" },
  { ext: "SRC",  sub: "any code"   },
];

type Phase = "idle" | "uploading" | "converting" | "done" | "error";

const SAMPLE_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><title>Castdown Sample</title></head>
<body>
<h1>Sample HTML</h1>
<p>This is a <strong>sample HTML</strong> sent through <code>/api/cast</code> to verify the
HTML → Markdown pipeline end-to-end.</p>
<h2>Table</h2>
<table>
  <thead><tr><th>Format</th><th>Engine</th></tr></thead>
  <tbody>
    <tr><td>PDF</td><td>pdfminer.six</td></tr>
    <tr><td>DOCX</td><td>mammoth</td></tr>
    <tr><td>HTML</td><td>markdownify</td></tr>
  </tbody>
</table>
<blockquote>Brutalism is the absence of apology.</blockquote>
</body></html>`;

export function ToMd() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [output, setOutput] = useState("");
  const [applied, setApplied] = useState<string[]>([]);
  const [activeFmt, setActiveFmt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  function pick() { inputRef.current?.click(); }

  function trySample() {
    const blob = new Blob([SAMPLE_HTML], { type: "text/html" });
    const f = new File([blob], "sample.html", { type: "text/html" });
    handle(f);
  }

  async function handle(f?: File | null) {
    if (!f) return;
    setFile(f); setPhase("uploading"); setErr(null); setOutput(""); setElapsedMs(0);
    setActiveFmt((f.name.split(".").pop() ?? "").toUpperCase());
    log("inf", `POST /api/cast · ${f.name} · ${(f.size/1024).toFixed(1)} KB`);
    // Tiny artificial split so the UPLOAD stage is visible before the request resolves.
    setTimeout(() => setPhase((p) => (p === "uploading" ? "converting" : p)), 120);
    try {
      const res = await castFile(f);
      setOutput(res.markdown);
      setApplied(res.meta.cleaners_applied ?? []);
      setElapsedMs(res.meta.elapsed_ms);
      setPhase("done");
      log("ok", `CAST OK · ${f.name} · ${res.meta.elapsed_ms}ms · ${res.meta.chars} chars`);
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg); setPhase("error");
      log("err", `CAST FAIL · ${msg}`);
    }
  }

  async function copyOut() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    log("inf", "copied md to clipboard");
  }

  function download() {
    if (!output) return;
    const blob = new Blob([output], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (file?.name.replace(/\.[^.]+$/, "") ?? "document") + ".md";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function reset() {
    setPhase("idle"); setFile(null); setOutput(""); setApplied([]); setErr(null); setActiveFmt(null);
  }

  return (
    <div className="border-r-2 border-ink border-b-2">
      <div className="sec-head">
        <div className="num">01</div>
        <div className="ttl">cualquier archivo <span className="arr">→</span> .md</div>
        <div className="right-meta">
          <span className="pill solid">POST /api/cast</span>
          <span className="pill">multipart</span>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files[0]); }}
        onClick={phase === "idle" ? pick : undefined}
        className={
          "relative m-3.5 p-5 border-2 border-dashed cursor-pointer transition-colors " +
          (over || phase === "uploading"
            ? "border-red bg-ink text-bg"
            : "border-ink hover:border-red hover:bg-ink hover:text-bg")
        }
        style={{
          minHeight: 280,
          backgroundImage: "repeating-linear-gradient(45deg, transparent 0 12px, rgba(11,11,11,0.025) 12px 13px)",
        }}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />

        {phase === "idle" && (
          <>
            <div className="text-[22px] font-extrabold uppercase mb-2">arrastra un archivo aquí</div>
            <div className="text-mute">o haz click para subir · drop, click, listo · max 50 MB</div>
            <div className="mt-4 text-[11px]">
              <span className="text-mute">accepts:</span>{" "}
              {IN_FORMATS.map((f) => f.ext).join(" · ")}
            </div>
          </>
        )}

        {phase !== "idle" && (
          <div className="fadein" onClick={(e) => e.stopPropagation()}>
            <div className="text-[22px] font-extrabold uppercase mb-2">{file?.name}</div>
            <div className="text-[11px] opacity-70">{((file?.size ?? 0) / 1024).toFixed(1)} KB · {file?.type || "unknown"}</div>

            {(phase === "uploading" || phase === "converting") && (
              <div className="mt-4">
                <Stage label="upload"  state={phase === "uploading" ? "active" : "done"} />
                <Stage label="convert" state={phase === "converting" ? "active" : phase === "uploading" ? "pending" : "done"} />
                <Stage label="clean"   state={phase === "converting" ? "active" : "pending"} hint="cleaners pipeline" />
              </div>
            )}

            {phase === "done" && (
              <>
                <div className="mt-3 border-2 border-ink bg-white text-ink p-3 max-h-[180px] overflow-auto">
                  <pre className="m-0 text-[12px] leading-[1.5] whitespace-pre-wrap">
                    {output.slice(0, 1200) + (output.length > 1200 ? "\n…" : "")}
                  </pre>
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-wider opacity-80 flex gap-3">
                  <span><b>{output.length}</b> chars</span>
                  <span><b>{elapsedMs}</b>ms</span>
                  {applied.length > 0 && <span>cleaners: <b>{applied.join(" · ")}</b></span>}
                </div>
                <div className="mt-3 flex gap-0">
                  <button className="btn primary" onClick={(e) => { e.stopPropagation(); download(); }}>↓ Download .md</button>
                  <button className="btn" onClick={(e) => { e.stopPropagation(); copyOut(); }}>Copy</button>
                  <button className="btn" onClick={(e) => { e.stopPropagation(); reset(); }}>Reset</button>
                </div>
              </>
            )}

            {phase === "error" && (
              <>
                <div className="mt-3 text-red font-bold text-[12px]">ERROR: {err}</div>
                <div className="mt-3 flex gap-0">
                  <button className="btn" onClick={(e) => { e.stopPropagation(); reset(); }}>Try again</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-6 border-t-2 border-ink">
        {IN_FORMATS.slice(0, 6).map((f) => <FmtCell key={f.ext} f={f} active={activeFmt === f.ext} />)}
      </div>
      <div className="grid grid-cols-6">
        {IN_FORMATS.slice(6, 12).map((f) => <FmtCell key={f.ext} f={f} active={activeFmt === f.ext} />)}
      </div>

      <div className="grid grid-cols-[1fr_auto_auto_auto] border-t-2 border-ink">
        <div className="px-3 py-2.5 text-[11px] text-mute border-r-2 border-ink flex items-center">
          <span className="text-mute">engine:</span>&nbsp;<b>MarkItDown</b>&nbsp;·&nbsp;
          <span className="text-mute">cleaners:</span>&nbsp;<b>10 + remark</b>
        </div>
        <button className="btn" onClick={(e) => { e.stopPropagation(); trySample(); }}>Try sample.html</button>
        <button className="btn" onClick={pick}>Choose file</button>
        <button className="btn primary" onClick={pick}>Upload</button>
      </div>
    </div>
  );
}

function Stage({
  label,
  state,
  hint,
}: {
  label: string;
  state: "pending" | "active" | "done";
  hint?: string;
}) {
  const mark = state === "done" ? "✓" : state === "active" ? "●" : "○";
  const color = state === "done" ? "text-bg" : state === "active" ? "text-red" : "text-bg/40";
  return (
    <div className="grid grid-cols-[20px_70px_1fr] items-center py-0.5 text-[11px] uppercase tracking-wider">
      <span className={"font-bold " + color + (state === "active" ? " blink" : "")}>{mark}</span>
      <span className="font-bold">{label}</span>
      <span className="text-bg/50 text-[10px]">{hint ?? (state === "active" ? "in progress" : state === "done" ? "ok" : "queued")}</span>
    </div>
  );
}

function FmtCell({ f, active }: { f: { ext: string; sub: string }; active: boolean }) {
  return (
    <div
      className={
        "px-2 py-2.5 border-r-2 border-ink last:border-r-0 text-[11px] font-bold text-center uppercase cursor-pointer bg-bg hover:bg-ink hover:text-bg " +
        (active ? "bg-ink text-bg shadow-[inset_0_-3px_0_0_var(--red)]" : "")
      }
    >
      <div>{f.ext}</div>
      <span className={"block font-medium text-[10px] " + (active ? "text-bg opacity-65" : "text-mute")}>{f.sub}</span>
    </div>
  );
}
