"use client";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-6 px-5 py-6 border-b-2 border-ink bg-bg text-[11px]">
      <div>
        <div className="text-[80px] font-extrabold leading-[0.9] tracking-[-0.04em] lowercase">castdown</div>
        <p className="max-w-[420px] mt-3 text-mute">
          Cast anything down to Markdown. Self-hostable. MCP-first. Brutalist by choice, not accident.
        </p>
      </div>
      <Col title="Product" items={["Docs", "API", "MCP", "CLI", "Roadmap"]} />
      <Col title="Self-host" items={["Pi 5 guide", "docker-compose", "Cloudflare Tunnel", "Hetzner"]} />
      <Col title="Project" items={["GitHub ↗", "Issues ↗", "License", `© ${year}`]} />
    </footer>
  );
}

function Col({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h5 className="m-0 mb-2.5 text-[11px] font-extrabold uppercase tracking-widest">{title}</h5>
      {items.map((i) => (
        <a key={i} href="#" className="text-ink no-underline block py-0.5 hover:bg-ink hover:text-bg">{i}</a>
      ))}
    </div>
  );
}
