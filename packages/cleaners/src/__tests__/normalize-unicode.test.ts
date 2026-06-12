import { describe, it, expect } from "vitest";
import { normalizeUnicode } from "../regex/normalize-unicode.js";

const ACUTE = "́"; // combining acute (U+0301)
const SP = "´"; // spacing acute (U+00B4) — what pdfminer emits

describe("normalizeUnicode — misplaced PDF accent recovery", () => {
  it("attaches a standalone spacing acute to the following vowel (real pdfminer)", () => {
    expect(normalizeUnicode("duraci" + SP + "on")).toBe("duración");
    expect(normalizeUnicode("est" + SP + "a")).toBe("está");
    expect(normalizeUnicode("electr" + SP + "onicos")).toBe("electrónicos");
    expect(normalizeUnicode("m" + SP + "etodo")).toBe("método");
  });

  it("fixes a full sentence of pdfminer spacing accents", () => {
    const dirty = "La duraci" + SP + "on de esta prueba. No est" + SP + "a permitido.";
    expect(normalizeUnicode(dirty)).toBe("La duración de esta prueba. No está permitido.");
  });

  it("also handles combining marks placed before the vowel", () => {
    expect(normalizeUnicode("est" + ACUTE + "a")).toBe("está");
    expect(normalizeUnicode("duraci" + ACUTE + "on")).toBe("duración");
  });

  it("leaves an already-correct precomposed string untouched", () => {
    expect(normalizeUnicode("está duración método")).toBe("está duración método");
    expect(normalizeUnicode("niño café señor")).toBe("niño café señor");
  });

  it("does not push an accent onto a letter with no precomposed form", () => {
    expect(normalizeUnicode("x" + SP + "b")).toBe("x" + SP + "b"); // b has no acute form
  });

  it("leaves ASCII syntax untouched (^ ~ ` are not accents)", () => {
    expect(normalizeUnicode("x^2")).toBe("x^2");
    expect(normalizeUnicode("a~b")).toBe("a~b");
    expect(normalizeUnicode("use `code` here")).toBe("use `code` here");
  });

  it("does not touch code blocks", () => {
    const md = "```\nlet x = a" + SP + "b;\n```";
    expect(normalizeUnicode(md)).toBe(md);
  });

  it("still maps smart quotes and dashes", () => {
    expect(normalizeUnicode("“hola” – ya")).toBe('"hola" — ya');
  });

  it("is idempotent", () => {
    const once = normalizeUnicode("duraci" + SP + "on de la prueba");
    expect(normalizeUnicode(once)).toBe(once);
  });
});
