/**
 * Tiny argv parser. Avoids pulling in yargs/commander for a 4-command CLI.
 *
 * Positional args go to `_`.
 * --flag value         → { flag: "value" }
 * --flag=value         → { flag: "value" }
 * --boolean            → { boolean: true }
 * -x value             → { x: "value" }
 */
export interface ParsedArgs {
  _: string[];
  [key: string]: string | boolean | string[];
}

export function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq >= 0) {
        out[a.slice(2, eq)] = a.slice(eq + 1);
      } else {
        const key = a.slice(2);
        const next = argv[i + 1];
        if (next === undefined || next.startsWith("-")) {
          out[key] = true;
        } else {
          out[key] = next;
          i++;
        }
      }
    } else if (a.startsWith("-") && a.length > 1) {
      const key = a.slice(1);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("-")) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(a);
    }
  }
  return out;
}
