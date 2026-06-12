"use client";
import { useEffect, useState } from "react";
import { snapshot, subscribe, type LogLine } from "../lib/activity";

const LVL_CLS: Record<string, string> = {
  ok:  "text-[#b9ffa5]",
  err: "text-red font-bold",
  inf: "text-white/85",
  dim: "text-white/45",
};

export function LiveLog() {
  const [lines, setLines] = useState<LogLine[]>(snapshot());

  useEffect(() => {
    return subscribe(() => setLines(snapshot()));
  }, []);

  return (
    <section className="border-b-2 border-ink bg-ink text-bg h-[120px] overflow-hidden relative">
      <div className="h-[22px] flex items-center border-b border-white/20 px-3 uppercase tracking-wider font-bold text-[10px] text-white/70">
        // LIVE ACTIVITY LOG
        <span className="flex-1" />
        <span className="text-white/40">{lines.length} events</span>
      </div>
      <div className="p-1.5 px-3 h-[calc(100%-22px)] overflow-y-auto font-mono">
        {lines.length === 0 && <div className="text-white/40 text-[11px]">// waiting for activity…</div>}
        {lines.slice().reverse().map((l, i) => (
          <div key={l.ts + "_" + i} className={"whitespace-pre tabular-nums text-[11px] " + (LVL_CLS[l.lvl] ?? "")}>
            {fmtTime(l.ts)} [{l.lvl.toUpperCase()}] {l.text}
          </div>
        ))}
      </div>
    </section>
  );
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", { hour12: false });
}
