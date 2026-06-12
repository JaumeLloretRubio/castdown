#!/usr/bin/env node
// PostToolUse hook: runs workspace typecheck after editing a .ts/.tsx file
import { execSync } from "child_process";
import { createInterface } from "readline";

const WORKSPACES = [
  ["apps/web", "@castdown/web"],
  ["services/api", "@castdown/api"],
  ["services/pandoc", "@castdown/pandoc-svc"],
  ["services/crawler", "@castdown/crawler-svc"],
  ["packages/cleaners", "castdown-cleaners"],
  ["packages/mcp", "castdown-mcp"],
  ["packages/shared", "@castdown/shared"],
  ["packages/storage", "@castdown/storage"],
];

let raw = "";
const rl = createInterface({ input: process.stdin });
rl.on("line", (line) => (raw += line));
rl.on("close", () => {
  try {
    const { tool_input } = JSON.parse(raw);
    const fp = (tool_input?.file_path ?? "").replace(/\\/g, "/");
    if (!/\.(ts|tsx)$/.test(fp)) return;

    const match = WORKSPACES.find(([path]) => fp.includes(path));
    if (!match) return;

    const [, filter] = match;
    try {
      execSync(`pnpm --filter ${filter} typecheck`, {
        stdio: "pipe",
        cwd: process.cwd(),
      });
      process.stdout.write(`\x1b[32m✓ typecheck\x1b[0m ${filter}\n`);
    } catch (err) {
      const out = (err.stdout?.toString() ?? "") + (err.stderr?.toString() ?? "");
      process.stdout.write(
        `\x1b[33m⚠ typecheck errors\x1b[0m in ${filter}:\n${out}\n`
      );
      // PostToolUse: warn but do not block (exit 0)
    }
  } catch {
    // parse failure → silent
  }
});
