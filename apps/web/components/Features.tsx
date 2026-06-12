"use client";

const CELLS = [
  { ix: "01", h: "REST API",   p: "POST /api/cast, /api/crawl. X-API-Key header. Rate limit per key." },
  { ix: "02", h: "MCP SERVER", p: "npx castdown-mcp. cast_file · render_markdown · fetch_page · crawl_url for Claude/Cursor/Windsurf." },
  { ix: "03", h: "CLEANERS",   p: "29 regex passes. Dirty PDFs in, clean MD out. Every pass skippable." },
  { ix: "04", h: "SELF-HOST",  p: "docker compose up. Runs on a Raspberry Pi. Tailscale Funnel for public access." },
];

export function Features() {
  return (
    <section className="grid grid-cols-4 border-b-2 border-ink">
      {CELLS.map((c) => (
        <div
          key={c.ix}
          className="px-4 py-4 border-r-2 border-ink last:border-r-0 min-h-[170px] bg-bg flex flex-col hover:bg-ink hover:text-bg group"
        >
          <div className="text-[11px] font-bold mb-1.5 tracking-wider text-mute group-hover:text-bg/65">{c.ix}</div>
          <h4 className="m-0 mb-2 text-[18px] font-extrabold uppercase tracking-tight leading-tight">{c.h}</h4>
          <p className="m-0 mb-2.5 text-[12px] leading-[1.5]">{c.p}</p>
        </div>
      ))}
    </section>
  );
}
