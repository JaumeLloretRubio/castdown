"use client";
import { useEffect, useState } from "react";
import { DEFAULT_DEV_KEY, getApiKey, setApiKey, validateKey, type WhoAmI } from "../lib/api";
import { log } from "../lib/activity";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const [key, setKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<WhoAmI | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setKey(getApiKey());
    setResult(null);
    setErr(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function test() {
    setTesting(true); setErr(null); setResult(null);
    try {
      const r = await validateKey(key.trim() || DEFAULT_DEV_KEY);
      setResult(r);
      log("ok", `KEY OK · source=${r.source} · scopes=${r.scopes.join(",")} · rl=${r.rate_limit_per_min}/min`);
    } catch (e) {
      const msg = (e as Error).message;
      setErr(msg);
      log("err", `KEY FAIL · ${msg}`);
    } finally {
      setTesting(false);
    }
  }

  function save() {
    setApiKey(key);
    log("inf", `KEY SAVED · ${maskKey(key)}`);
    onClose();
  }

  function clearKey() {
    setKey("");
    setApiKey("");
    setResult(null);
    log("inf", "KEY CLEARED · using dev default");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 fadein"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="API key settings"
    >
      <div
        className="bg-bg border-2 border-ink w-[min(560px,calc(100vw-2rem))] shadow-[8px_8px_0_0_rgba(11,11,11,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sec-head">
          <div className="num">⚙</div>
          <div className="ttl">api key <span className="arr">·</span> settings</div>
          <div className="right-meta">
            <button onClick={onClose} className="uppercase text-[11px] font-bold hover:bg-ink hover:text-bg px-1.5">esc · close</button>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <label className="text-[11px] uppercase font-bold text-mute">X-API-Key</label>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={DEFAULT_DEV_KEY}
            className="border-2 border-ink px-2.5 py-2 font-mono text-[13px] outline-none bg-paper"
            autoFocus
          />

          <div className="flex gap-2">
            <button className="btn" onClick={test} disabled={testing || !key.trim()}>
              {testing ? "TESTING…" : "TEST"}
            </button>
            <button className="btn primary" onClick={save} disabled={testing}>
              SAVE
            </button>
            <button className="btn" onClick={clearKey} disabled={testing}>
              RESET
            </button>
          </div>

          {result && (
            <div className="border-2 border-ink p-2.5 bg-paper text-[12px] flex flex-col gap-1 fadein">
              <Row k="status" v={<span className="font-bold text-red">OK · authenticated</span>} />
              <Row k="source" v={result.source === "db" ? "database" : "env (.env API_KEYS)"} />
              <Row k="key id" v={result.key_id ?? "—"} />
              <Row k="scopes" v={result.scopes.join(", ")} />
              <Row k="rate limit" v={`${result.rate_limit_per_min} req / min`} />
            </div>
          )}

          {err && (
            <div className="border-2 border-red p-2.5 text-[12px] font-bold text-red fadein">
              {err === "unauthorized" ? "REJECTED · key not recognized by gateway" : `ERR · ${err}`}
            </div>
          )}

          <p className="text-[10px] text-mute leading-relaxed mt-1">
            Stored in <code className="font-bold">localStorage.cd_api_key</code>. Sent as <code className="font-bold">X-API-Key</code> on every request.
            Empty = fallback to dev key <code className="font-bold">{DEFAULT_DEV_KEY}</code>.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <span className="text-mute uppercase text-[10px]">{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}

function maskKey(k: string): string {
  if (!k) return "(empty → dev default)";
  if (k.length <= 8) return k.slice(0, 2) + "***";
  return k.slice(0, 4) + "…" + k.slice(-3);
}
