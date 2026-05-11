#!/usr/bin/env node
/**
 * Issue a new API key from the CLI. Run with:
 *   pnpm -F @castdown/api issue-key <name> [--scopes cast,crawl] [--rate-limit 60]
 */
import { issueApiKey } from "../src/db/repo.js";
import "../src/db/index.js";

function main() {
  const args = process.argv.slice(2);
  const name = args.find((a) => !a.startsWith("--"));
  if (!name) {
    console.error("usage: issue-key <name> [--scopes cast,crawl] [--rate-limit 60]");
    process.exit(1);
  }
  const scopesArg = args[args.indexOf("--scopes") + 1];
  const rateArg = args[args.indexOf("--rate-limit") + 1];

  const { id, key } = issueApiKey(name, {
    scopes: scopesArg && !scopesArg.startsWith("--") ? scopesArg : undefined,
    rateLimit: rateArg && !rateArg.startsWith("--") ? Number(rateArg) : undefined,
  });

  console.log(JSON.stringify({ id, key, name }, null, 2));
  console.log("\nSave this key now — only the hash is stored.");
}
main();
