"use client";

/**
 * Minimal pub-sub for the live activity log. No store library needed —
 * the log component subscribes; any component pushes lines.
 */
export type LogLevel = "ok" | "err" | "inf" | "dim";
export interface LogLine {
  ts: number;
  lvl: LogLevel;
  text: string;
}

type Listener = (line: LogLine) => void;
const listeners = new Set<Listener>();
const buffer: LogLine[] = [];
const MAX = 50;

export function log(lvl: LogLevel, text: string): void {
  const line = { ts: Date.now(), lvl, text };
  buffer.push(line);
  if (buffer.length > MAX) buffer.shift();
  listeners.forEach((l) => l(line));
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function snapshot(): LogLine[] {
  return buffer.slice();
}
