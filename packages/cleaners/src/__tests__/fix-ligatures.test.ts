import { describe, it, expect } from "vitest";
import { fixLigatures } from "../regex/fix-ligatures.js";

describe("fixLigatures", () => {
  it("ﬁ → fi", () => {
    expect(fixLigatures("ﬁgure")).toBe("figure");
  });

  it("ﬂ → fl", () => {
    expect(fixLigatures("ﬂow")).toBe("flow");
  });

  it("ﬀ → ff", () => {
    expect(fixLigatures("ﬀect")).toBe("ffect");
  });

  it("ﬃ → ffi", () => {
    expect(fixLigatures("ﬃne")).toBe("ffine");
  });

  it("ﬄ → ffl", () => {
    expect(fixLigatures("ﬄoor")).toBe("ffloor");
  });

  it("is idempotent", () => {
    expect(fixLigatures("figure flow")).toBe("figure flow");
  });

  it("preserves content inside code blocks", () => {
    const input = "```\nﬁgure\n```";
    expect(fixLigatures(input)).toBe(input);
  });

  it("does NOT touch Æ or œ (not FB00-FB06 ligatures)", () => {
    expect(fixLigatures("Æther")).toBe("Æther");
    expect(fixLigatures("œuvre")).toBe("œuvre");
  });

  it("accepts custom ligatureMap override", () => {
    const result = fixLigatures("ﬁgure", { ligatureMap: { "ﬁ": "FI" } });
    expect(result).toBe("FIgure");
  });
});
