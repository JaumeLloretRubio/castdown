"use client";
import { useEffect, useState } from "react";

export function StatusBar() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" })),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sticky bottom-0 h-6 bg-ink text-bg flex items-stretch text-[10.5px] uppercase tracking-wider">
      <Seg cls="bg-red text-white">CASTDOWN</Seg>
      <Seg>v0.1.0-alpha</Seg>
      <Seg>self-host · docker</Seg>
      <div className="flex-1" />
      <Seg>UTC {time}</Seg>
      <Seg cls="bg-[var(--hi)] text-ink">Jayoru</Seg>
    </div>
  );
}

function Seg({ children, cls = "" }: { children: React.ReactNode; cls?: string }) {
  return (
    <div className={"px-3 flex items-center border-r border-white/20 font-bold " + cls}>{children}</div>
  );
}
