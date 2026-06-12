"use client";

// Static, factual numbers — keep in sync with the codebase:
// 12 input formats (ToMd grid), 6 output targets (FromMd grid),
// 29 cleaner passes (packages/cleaners/src/regex), 4 MCP tools (packages/mcp).
const FACTS = [
  { k: "Input formats", v: "12+" },
  { k: "Output targets", v: "6" },
  { k: "Cleaner passes", v: "29" },
  { k: "MCP tools", v: "4" },
  { k: "Self-host", v: "1 command" },
  { k: "License", v: "Apache-2.0" },
];

export function Hero() {
  return (
    <section className="grid grid-cols-[1fr_380px] border-b-2 border-ink">
      <div className="px-6 py-7 border-r-2 border-ink">
        <h1 className="font-mono font-extrabold text-[64px] leading-[0.95] tracking-tight mb-3.5 lowercase">
          castdown<span className="inline-block w-[0.55em] h-[0.85em] bg-ink align-[-0.05em] ml-0.5 blink" />
        </h1>
        <p className="text-base leading-[1.5] max-w-[640px] mb-4">
          The Swiss-army knife of Markdown.{" "}
          <strong className="bg-ink text-bg px-1">Any file in. Markdown out.</strong>{" "}
          Markdown in. Any format out. A URL in. A tree of linked <code>.md</code> out. All of it
          exposed as a REST API and an MCP Server so agents can use it directly.
        </p>
        <div className="flex flex-wrap gap-0">
          <Badge solid>* → .md</Badge>
          <Badge>.md → *</Badge>
          <Badge>URL → /tree</Badge>
          <Badge>REST API</Badge>
          <Badge red>MCP Server</Badge>
          <Badge>SELF-HOST</Badge>
        </div>
      </div>
      <aside className="px-4 py-4 bg-paper flex flex-col gap-2.5 text-[11px]">
        <div className="uppercase font-bold text-[11px] mb-1">// AT A GLANCE</div>
        {FACTS.map((f) => (
          <Stat key={f.k} k={f.k} v={f.v} />
        ))}
        <div className="uppercase text-mute text-[10px] mt-1.5">runs on a raspberry pi · docker compose up</div>
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
