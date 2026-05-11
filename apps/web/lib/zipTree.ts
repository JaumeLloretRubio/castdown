import JSZip from "jszip";

export interface ZipEntry {
  path: string;
  isDir: boolean;
}

export interface ZipSummary {
  entries: ZipEntry[];
  fileCount: number;
  tree: string;
}

export async function inspectZip(blob: Blob): Promise<ZipSummary> {
  const zip = await JSZip.loadAsync(blob);
  const entries: ZipEntry[] = [];
  zip.forEach((path, file) => {
    entries.push({ path, isDir: file.dir });
  });
  entries.sort((a, b) => a.path.localeCompare(b.path));
  const fileCount = entries.filter((e) => !e.isDir).length;
  return { entries, fileCount, tree: renderTree(entries) };
}

export function renderTree(entries: ZipEntry[]): string {
  const files = entries.filter((e) => !e.isDir).map((e) => e.path);
  if (files.length === 0) return "(empty zip)";

  type Node = { name: string; children: Map<string, Node>; isFile: boolean };
  const root: Node = { name: "", children: new Map(), isFile: false };

  for (const path of files) {
    const parts = path.split("/").filter(Boolean);
    let cur = root;
    parts.forEach((part, idx) => {
      const last = idx === parts.length - 1;
      let next = cur.children.get(part);
      if (!next) {
        next = { name: part, children: new Map(), isFile: last };
        cur.children.set(part, next);
      } else if (last) {
        next.isFile = true;
      }
      cur = next;
    });
  }

  const lines: string[] = [];
  function walk(node: Node, prefix: string, isLast: boolean, isRoot: boolean) {
    if (!isRoot) {
      const branch = isLast ? "└── " : "├── ";
      const suffix = node.children.size > 0 && !node.isFile ? "/" : "";
      lines.push(prefix + branch + node.name + suffix);
    }
    const kids = Array.from(node.children.values()).sort((a, b) => {
      const aDir = a.children.size > 0 ? 0 : 1;
      const bDir = b.children.size > 0 ? 0 : 1;
      if (aDir !== bDir) return aDir - bDir;
      return a.name.localeCompare(b.name);
    });
    const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "│   ");
    kids.forEach((child, i) => walk(child, childPrefix, i === kids.length - 1, false));
  }
  walk(root, "", true, true);
  return lines.join("\n");
}
