#!/usr/bin/env node
// PreToolUse hook: blocks Edit/Write on .env files and pnpm-lock.yaml
import { createInterface } from "readline";

let raw = "";
const rl = createInterface({ input: process.stdin });
rl.on("line", (line) => (raw += line));
rl.on("close", () => {
  try {
    const { tool_input } = JSON.parse(raw);
    const fp = (tool_input?.file_path ?? "").replace(/\\/g, "/");
    const name = fp.split("/").pop() ?? "";
    const blocked =
      /^\.env($|\.)/.test(name) || name === "pnpm-lock.yaml";
    if (blocked) {
      process.stderr.write(
        `\x1b[31mBlocked:\x1b[0m editing '${name}' is disallowed (sensitive file).\n` +
          `Edit .env.example or .env.local.example instead, then copy manually.\n`
      );
      process.exit(2);
    }
  } catch {
    // parse failure → allow
  }
});
