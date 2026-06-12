import { describe, it, expect } from "vitest";
import { normalizeUnicode } from "../regex/normalize-unicode.js";

const ACUTE = "́"; // combining acute

describe("normalizeUnicode — misplaced PDF accent recovery", () => {
  it("moves an accent placed one letter early onto the vowel (real pdfminer cases)", () => {
    expect(normalizeUnicode("est" + ACUTE + "a")).toBe("está");
    expect(normalizeUnicode("duraci" + ACUTE + "on")).toBe("duración");
    expect(normalizeUnicode("m" + ACUTE + "etodo")).toBe("método");
    expect(normalizeUnicode("Ade" + "m" + ACUTE + "as")).toBe("Además");
    expect(normalizeUnicode("valorar" + ACUTE + "a")).toBe("valorará");
    expect(normalizeUnicode("electr" + ACUTE + "onicos")).toBe("electrónicos");
    expect(normalizeUnicode("qu" + ACUTE + "e")).toBe("qué");
  });

  it("leaves an already-correct precomposed string untouched", () => {
    expect(normalizeUnicode("está duración método")).toBe("está duración método");
    expect(normalizeUnicode("niño café señor")).toBe("niño café señor");
  });

  it("does not push an accent onto a letter with no precomposed form", () => {
    // b has no acute-precomposed form → leave the mark where it is (just NFC)
    const input = "x" + ACUTE + "b";
    expect(normalizeUnicode(input)).toBe(input.normalize("NFC"));
  });

  it("composes a trailing combining mark with no following letter", () => {
    expect(normalizeUnicode("cafe" + ACUTE)).toBe("café");
  });

  it("leaves ASCII syntax untouched (^ ~ ` are not accents)", () => {
    expect(normalizeUnicode("x^2")).toBe("x^2");
    expect(normalizeUnicode("a~b")).toBe("a~b");
    expect(normalizeUnicode("use `code` here")).toBe("use `code` here");
  });

  it("does not touch code blocks", () => {
    const md = "```\nlet x = a" + ACUTE + "b;\n```";
    expect(normalizeUnicode(md)).toBe(md);
  });

  it("still maps smart quotes and dashes", () => {
    expect(normalizeUnicode("“hola” – ya")).toBe('"hola" — ya');
  });

  it("is idempotent", () => {
    const once = normalizeUnicode("duraci" + ACUTE + "on de la prueba");
    expect(normalizeUnicode(once)).toBe(once);
  });
});
