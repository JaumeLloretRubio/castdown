"use client";

const CELLS = [
  { ix: "01", h: "API REST",      p: "POST /api/cast, /api/crawl. X-API-Key header. Rate limit por key.", m: "examples →" },
  { ix: "02", h: "MCP SERVER",    p: "npx castdown-mcp. cast_file · fetch_page · crawl_url para Claude/Cursor/Windsurf.", m: "install →" },
  { ix: "03", h: "CLEANERS",      p: "10 regex + remark AST. PDFs sucios entran, MD limpio sale. Cada pase skippable.", m: "docs →" },
  { ix: "04", h: "SELF-HOST",     p: "docker compose up. Funciona en Raspberry Pi 5 8GB. Cloudflare Tunnel para acceso público.", m: "guide →" },
];

export function Features() {
  return (
    <section className="grid grid-cols-4 border-b-2 border-ink">
      {CELLS.map((c, i) => (
        <div
          key={c.ix}
          className={"px-4 py-4 border-r-2 border-ink last:border-r-0 min-h-[170px] bg-bg flex flex-col cursor-pointer hover:bg-ink hover:text-bg group " + (i === 0 ? "" : "")}
        >
          <div className="text-[11px] font-bold mb-1.5 tracking-wider text-mute group-hover:text-bg/65">{c.ix}</div>
          <h4 className="m-0 mb-2 text-[18px] font-extrabold uppercase tracking-tight leading-tight">{c.h}</h4>
          <p className="m-0 mb-2.5 text-[12px] leading-[1.5]">{c.p}</p>
          <div className="mt-auto text-[10px] uppercase tracking-widest text-mute group-hover:text-bg/65">{c.m}</div>
        </div>
      ))}
    </section>
  );
}
