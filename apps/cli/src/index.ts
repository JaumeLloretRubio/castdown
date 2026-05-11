#!/usr/bin/env node
/**
 * castdown CLI — minimal, no flag-parser dependency.
 *
 * Examples:
 *   castdown cast report.pdf > report.md
 *   castdown render report.md --to docx > report.docx
 *   castdown crawl https://docs.foo.com --depth 2 -o foo.zip
 *   castdown health
 */
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import kleur from "kleur";
import { parseArgs, type ParsedArgs } from "./args.js";

const API = process.env.CASTDOWN_API_URL ?? "http://localhost:3001";
const KEY = process.env.CASTDOWN_API_KEY ?? "cd_dev_changeme";

async function main(argv: string[]): Promise<number> {
  const args = parseArgs(argv);
  if (args._.length === 0 || args.help) return usage();

  const cmd = args._[0];
  try {
    switch (cmd) {
      case "cast":    return await castCmd(args);
      case "render":  return await renderCmd(args);
      case "crawl":   return await crawlCmd(args);
      case "health":  return await healthCmd();
      case "help":    return usage();
      default:
        console.error(kleur.red(`unknown command: ${cmd}`));
        return usage(2);
    }
  } catch (e) {
    console.error(kleur.red(`error: ${(e as Error).message}`));
    return 1;
  }
}

function usage(code = 0): number {
  console.log(`
${kleur.bold("castdown")} — cast anything down to markdown

${kleur.bold("USAGE")}
  castdown <command> [options]

${kleur.bold("COMMANDS")}
  ${kleur.cyan("cast")}     <file>                Convert a file to markdown (stdout)
  ${kleur.cyan("render")}   <md> --to <format>    Render markdown to pdf/docx/html/pptx/epub
  ${kleur.cyan("crawl")}    <url> [--depth N]     Crawl a site, output ZIP of .md
  ${kleur.cyan("health")}                         Check API health
  ${kleur.cyan("help")}                           This help

${kleur.bold("OPTIONS")}
  --to <fmt>        Target format for render (default: pdf)
  --template <name> Template name (e.g. report)
  --depth <n>       Crawl depth (default: 2)
  --max-pages <n>   Crawl page cap (default: 100)
  --skip <c1,c2>    Skip named cleaners (cast only)
  --raw             Skip cleaners pipeline entirely (cast only)
  -o, --output <f>  Output file (default: stdout)

${kleur.bold("ENV")}
  CASTDOWN_API_URL  default: http://localhost:3001
  CASTDOWN_API_KEY  default: cd_dev_changeme
`);
  return code;
}

async function castCmd(args: ParsedArgs): Promise<number> {
  const inputPath = args._[1];
  if (!inputPath) throw new Error("file required: castdown cast <file>");

  const data = await readFile(inputPath);
  const fd = new FormData();
  fd.append("file", new Blob([data]), basename(inputPath));

  const params = new URLSearchParams();
  if (args.skip) params.set("skip_cleaners", String(args.skip));
  if (args.raw) params.set("raw", "1");

  const url = `${API}/api/cast${params.toString() ? "?" + params : ""}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "X-API-Key": KEY },
    body: fd,
  });
  if (!res.ok) throw new Error(`api ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { markdown: string; meta: Record<string, unknown> };

  await output(args, body.markdown);
  console.error(kleur.gray(`  ${body.meta.elapsed_ms}ms · ${body.meta.chars} chars · cleaners: ${(body.meta.cleaners_applied as string[]).join(",") || "none"}`));
  return 0;
}

async function renderCmd(args: ParsedArgs): Promise<number> {
  const inputPath = args._[1];
  if (!inputPath) throw new Error("file required: castdown render <md>");
  const target = (args.to as string | undefined) ?? "pdf";
  const md = await readFile(inputPath, "utf8");

  const res = await fetch(`${API}/api/cast`, {
    method: "POST",
    headers: { "X-API-Key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ markdown: md, target, template: args.template }),
  });
  if (!res.ok) throw new Error(`api ${res.status}: ${await res.text()}`);

  const buf = Buffer.from(await res.arrayBuffer());
  await output(args, buf, target);
  console.error(kleur.gray(`  ${res.headers.get("x-elapsed-ms")}ms · ${buf.length} bytes`));
  return 0;
}

async function crawlCmd(args: ParsedArgs): Promise<number> {
  const url = args._[1];
  if (!url) throw new Error("url required: castdown crawl <url>");

  const res = await fetch(`${API}/api/crawl`, {
    method: "POST",
    headers: { "X-API-Key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      depth: Number(args.depth ?? 2),
      max_pages: Number(args["max-pages"] ?? 100),
      format: "zip",
    }),
  });
  if (!res.ok) throw new Error(`api ${res.status}: ${await res.text()}`);

  const buf = Buffer.from(await res.arrayBuffer());
  await output(args, buf, "zip");
  console.error(kleur.gray(`  ${buf.length} bytes`));
  return 0;
}

async function healthCmd(): Promise<number> {
  const res = await fetch(`${API}/health`);
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
  return res.ok ? 0 : 1;
}

async function output(args: ParsedArgs, data: string | Buffer, fallbackExt = "md"): Promise<void> {
  const out = (args.output ?? args.o) as string | undefined;
  if (out) {
    await writeFile(out, typeof data === "string" ? data : data);
    console.error(kleur.green(`wrote ${out}`));
    return;
  }
  if (typeof data === "string") {
    process.stdout.write(data);
  } else {
    // Binary to stdout
    process.stdout.write(data);
  }
  void fallbackExt;
}

main(process.argv.slice(2)).then((code) => process.exit(code));
