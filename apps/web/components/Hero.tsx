"use client";
import { useEffect, useState } from "react";

interface Counters {
  conv24h: number;
  pages24h: number;
  bytes24h: number;
  mcp24h: number;
  workers: number;
}

const SEED: Counters = {
  conv24h: 142_580,
  pages24h: 3_812_044,
  bytes24h: 2.4e12,
  mcp24h: 41_209,
  workers: 6,
};

function fmtBytes(n: number): string {
  if (n > 1e12) return (n / 1e12).toFixed(2) + " TB";
  if (n > 1e9) return (n / 1e9).toFixed(2) + " GB";
  if (n > 1e6) return (n / 1e6).toFixed(2) + " MB";
  return n + " B";
}

export function Hero() {
  const [c, setC] = useState<Counters>(SEED);
  useEffect(() => {
    const id = setInterval(() => {
      setC((p) => ({
        conv24h: p.conv24h + Math.floor(Math.random() * 4),
        pages24h: p.pages24h + Math.floor(Math.random() * 32),
        bytes24h: p.bytes24h + Math.floor(Math.random() * 5_000_000),
        mcp24h: p.mcp24h + (Math.random() > 0.5 ? 1 : 0),
        workers: p.workers,
      }));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="grid grid-cols-[1fr_380px] border-b-2 border-ink">
      <div className="px-6 py-7 border-r-2 border-ink">
        <h1 className="font-mono font-extrabold text-[64px] leading-[0.95] tracking-tight mb-3.5 lowercase">
          castdown<span className="inline-block w-[0.55em] h-[0.85em] bg-ink align-[-0.05em] ml-0.5 blink" />
        </h1>
        <p className="text-base leading-[1.5] max-w-[640px] mb-4">
          La navaja suiza del Markdown.{" "}
          <strong className="bg-ink text-bg px-1">Cualquier archivo entra. Markdown sale.</strong>{" "}
          Markdown entra. Cualquier formato sale. Una URL entra. Un árbol de <code>.md</code> enlazados sale. Y todo
          expuesto como API y como MCP Server para que los agentes lo usen directamente.
        </p>
        <div className="flex flex-wrap gap-0">
          <Badge solid>* → .md</Badge>
          <Badge>.md → *</Badge>
          <Badge>URL → /tree</Badge>
          <Badge>REST API</Badge>
          <Badge red>MCP Server</Badge>
          <Badge>CLI</Badge>
          <Badge>SELF-HOST</Badge>
        </div>
      </div>
      <aside className="px-4 py-4 bg-paper flex flex-col gap-2.5 text-[11px]">
        <div className="uppercase font-bold text-[11px] mb-1">// LIVE METRICS</div>
        <Stat k="Conversiones · 24h" v={c.conv24h.toLocaleString("es")} />
        <Stat k="Páginas crawleadas · 24h" v={c.pages24h.toLocaleString("es")} />
        <Stat k="Bytes procesados · 24h" v={fmtBytes(c.bytes24h)} />
        <Stat k="MCP calls · 24h" v={c.mcp24h.toLocaleString("es")} />
        <Stat k="Workers activos" v={c.workers + " / 16"} />
        <Stat k="Uptime · 30d" v="99.98 %" />
        <div className="uppercase text-mute text-[10px] mt-1.5">us-east-1 · eu-west-1 · ap-southeast-1</div>
      </aside>
    </section>
  );
}

function Badge({ children, solid, red }: { children: React.ReactNode; solid?: boolean; red?: boolean }) {
  let cls = "px-2.5 py-1.5 border-2 border-ink -mt-0.5 -mr-0.5 uppercase text-[11px] font-semibold tracking-wider bg-bg";
  if (solid) cls += " bg-ink text-bg";
  if (red) cls += " bg-red text-white border-red";
  return <span className={cls}>{children}</span>;
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] border-b border-dashed border-[rgba(11,11,11,0.35)] py-1">
      <span className="text-mute uppercase">{k}</span>
      <span className="font-bold tabular-nums">{v}</span>
    </div>
  );
}
