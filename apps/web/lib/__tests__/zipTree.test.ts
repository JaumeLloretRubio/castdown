import { describe, expect, it } from "vitest";
import { renderTree, type ZipEntry } from "../zipTree";

function entry(path: string, isDir = false): ZipEntry {
  return { path, isDir };
}

describe("renderTree", () => {
  it("returns placeholder for empty entries", () => {
    expect(renderTree([])).toBe("(empty zip)");
  });

  it("returns placeholder when only directory entries", () => {
    expect(renderTree([entry("docs/", true), entry("api/", true)])).toBe("(empty zip)");
  });

  it("renders a flat list with last-child branch", () => {
    const out = renderTree([entry("a.md"), entry("b.md"), entry("c.md")]);
    expect(out).toBe(["├── a.md", "├── b.md", "└── c.md"].join("\n"));
  });

  it("renders a nested tree with mixed dirs and files", () => {
    const out = renderTree([
      entry("index.md"),
      entry("getting-started.md"),
      entry("api/auth.md"),
      entry("api/endpoints.md"),
    ]);
    const expected = [
      "├── api/",
      "│   ├── auth.md",
      "│   └── endpoints.md",
      "├── getting-started.md",
      "└── index.md",
    ].join("\n");
    expect(out).toBe(expected);
  });

  it("orders directories before files at the same level", () => {
    const out = renderTree([
      entry("zeta.md"),
      entry("alpha/inside.md"),
    ]);
    const expected = [
      "├── alpha/",
      "│   └── inside.md",
      "└── zeta.md",
    ].join("\n");
    expect(out).toBe(expected);
  });

  it("handles deeply nested paths with correct continuation prefixes", () => {
    const out = renderTree([
      entry("docs/guide/intro.md"),
      entry("docs/guide/advanced/perf.md"),
      entry("docs/reference.md"),
    ]);
    const expected = [
      "└── docs/",
      "    ├── guide/",
      "    │   ├── advanced/",
      "    │   │   └── perf.md",
      "    │   └── intro.md",
      "    └── reference.md",
    ].join("\n");
    expect(out).toBe(expected);
  });

  it("ignores explicit directory entries when files cover them", () => {
    const out = renderTree([
      entry("api/", true),
      entry("api/auth.md"),
    ]);
    expect(out).toBe(["└── api/", "    └── auth.md"].join("\n"));
  });

  it("treats paths with empty segments robustly", () => {
    const out = renderTree([entry("a//b.md")]);
    expect(out).toBe(["└── a/", "    └── b.md"].join("\n"));
  });
});
