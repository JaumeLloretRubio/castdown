"use client";

const GITHUB_URL = "https://github.com/JaumeLloretRubio/castdown";

interface LinkItem {
  label: string;
  href: string;
  external?: boolean;
}

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
      <Col
        title="Product"
        items={[
          { label: "API", href: "#api" },
          { label: "MCP", href: "#mcp" },
          { label: "Docs ↗", href: `${GITHUB_URL}#readme`, external: true },
        ]}
      />
      <Col
        title="Self-host"
        items={[
          { label: "Raspberry Pi guide ↗", href: `${GITHUB_URL}#readme`, external: true },
          { label: "docker-compose ↗", href: `${GITHUB_URL}/blob/main/docker-compose.yml`, external: true },
        ]}
      />
      <Col
        title="Project"
        items={[
          { label: "GitHub ↗", href: GITHUB_URL, external: true },
          { label: "Issues ↗", href: `${GITHUB_URL}/issues`, external: true },
          { label: "License (Apache-2.0) ↗", href: `${GITHUB_URL}/blob/main/LICENSE`, external: true },
        ]}
        suffix={`© ${year}`}
      />
    </footer>
  );
}

function Col({ title, items, suffix }: { title: string; items: LinkItem[]; suffix?: string }) {
  return (
    <div>
      <h5 className="m-0 mb-2.5 text-[11px] font-extrabold uppercase tracking-widest">{title}</h5>
      {items.map((i) => (
        <a
          key={i.label}
          href={i.href}
          {...(i.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-ink no-underline block py-0.5 hover:bg-ink hover:text-bg"
        >
          {i.label}
        </a>
      ))}
      {suffix && <span className="block py-0.5 text-mute">{suffix}</span>}
    </div>
  );
}
