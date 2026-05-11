"use client";
import { useEffect, useState } from "react";
import { getHealth } from "../lib/api";
import { SettingsModal } from "./Settings";

export function Header() {
  const [tick, setTick] = useState(0);
  const [online, setOnline] = useState(true);
  const [latency, setLatency] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function probe() {
      const t0 = Date.now();
      try {
        const r = await getHealth();
        if (cancelled) return;
        setOnline(r.status === "ok" || r.status === "degraded");
        setLatency(Date.now() - t0);
      } catch {
        if (!cancelled) setOnline(false);
      }
    }
    probe();
    const id = setInterval(probe, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="sticky top-0 z-10 border-b-2 border-ink bg-bg">
      <div className="grid grid-cols-[auto_1fr_auto] items-stretch h-11">
        <div className="px-4 flex items-center gap-2.5 border-r-2 border-ink font-extrabold tracking-wide">
          <span className="inline-block w-3.5 h-3.5 bg-ink" />
          <span>castdown</span>
          <span className="text-mute font-medium">/0.1.0-alpha</span>
        </div>
        <div className="flex items-center px-3.5 gap-3.5 text-[11px] text-mute">
          <span className="flex items-center">
            <span className={"inline-block w-2 h-2 mr-1.5 blink " + (online ? "bg-red" : "bg-mute")} />
            EDGE · WORKERS · {online ? "ONLINE" : "OFFLINE"}
          </span>
          <span>·</span>
          <span>LATENCY <b className="text-ink">{latency || 142 + (tick % 17)}ms</b></span>
          <span>·</span>
          <span>QUEUE <b className="text-ink">{tick % 4}</b></span>
        </div>
        <nav className="flex items-stretch h-11">
          {["Docs", "API", "MCP", "GitHub ↗"].map((label) => (
            <a key={label} href="#" className="flex items-center px-3.5 border-l-2 border-ink uppercase tracking-wide text-xs font-semibold text-ink hover:bg-ink hover:text-bg">
              {label}
            </a>
          ))}
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center px-3.5 border-l-2 border-ink uppercase tracking-wide text-xs font-semibold bg-ink text-bg hover:bg-red hover:text-white"
            aria-label="Configure API key"
          >
            API Key
          </button>
        </nav>
      </div>
      <Ruler />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function Ruler() {
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= 80; i += 10) {
    const major = i % 20 === 0;
    ticks.push(
      <div
        key={i}
        className={
          "flex-1 border-r border-r-[rgba(11,11,11,0.18)] text-[9px] text-mute pl-1 flex items-center " +
          (major ? "border-r-ink text-ink" : "")
        }
      >
        {i.toString().padStart(2, "0")}
      </div>,
    );
  }
  return (
    <div className="h-[18px] border-b-2 border-ink bg-bg flex items-stretch overflow-hidden">
      {ticks}
    </div>
  );
}
