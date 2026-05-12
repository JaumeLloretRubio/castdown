import { describe, it, expect } from "vitest";
import { stripDocxArtifacts } from "../regex/strip-docx-artifacts.js";

describe("stripDocxArtifacts", () => {
  it("strips {.underline} span → bare text", () => {
    expect(stripDocxArtifacts("[texto importante]{.underline}")).toBe("texto importante");
  });

  it("strips {.smallcaps} span", () => {
    expect(stripDocxArtifacts("[María García]{.smallcaps}")).toBe("María García");
  });

  it("strips {.mark} and {.highlight} spans", () => {
    expect(stripDocxArtifacts("[resaltado]{.mark} y [otro]{.highlight}")).toBe("resaltado y otro");
  });

  it("converts {.strikethrough} to GFM ~~text~~", () => {
    expect(stripDocxArtifacts("[obsoleto]{.strikethrough}")).toBe("~~obsoleto~~");
  });

  it("replaces &nbsp; with space", () => {
    expect(stripDocxArtifacts("valor:&nbsp;42")).toBe("valor: 42");
  });

  it("removes pandoc hard line-break backslash", () => {
    expect(stripDocxArtifacts("línea uno\\ \nlínea dos")).toBe("línea uno\nlínea dos");
  });

  it("removes <!-- {.class} --> comment spans", () => {
    expect(stripDocxArtifacts("texto<!-- {.section} -->más")).toBe("textomás");
  });

  it("is idempotent on plain markdown", () => {
    const plain = "# Título\n\nPárrafo con **negrita** y _cursiva_.\n\n- item 1\n- item 2\n";
    expect(stripDocxArtifacts(plain)).toBe(plain);
  });

  it("preserves existing GFM strikethrough unchanged", () => {
    expect(stripDocxArtifacts("texto ~~tachado~~ normal")).toBe("texto ~~tachado~~ normal");
  });

  it("handles multiple spans on same line", () => {
    const input = "[título]{.underline} — [autor]{.smallcaps}";
    expect(stripDocxArtifacts(input)).toBe("título — autor");
  });
});
