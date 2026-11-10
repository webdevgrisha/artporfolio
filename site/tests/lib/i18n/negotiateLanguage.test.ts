import { describe, expect, it } from "vitest";

import { negotiateLanguage } from "@/lib/i18n/negotiateLanguage";

describe("negotiateLanguage", () => {
  it("takes the language of the site a browser asks for", () => {
    expect(negotiateLanguage("pl")).toBe("pl");
  });

  it("finds a language by its primary subtag when the site lacks the regional variant", () => {
    expect(negotiateLanguage("de-AT")).toBe("de");
    expect(negotiateLanguage("pt-PT,pt;q=0.9")).toBe("pt");
    expect(negotiateLanguage("zh-TW")).toBe("zh");
  });

  it("follows the weights, not the order of the header", () => {
    expect(negotiateLanguage("en;q=0.5, fr;q=0.9, uk;q=0.7")).toBe("fr");
  });

  it("keeps the order of the header for ranges of the same weight", () => {
    expect(negotiateLanguage("uk, ru")).toBe("uk");
  });

  it("skips the languages the site does not have", () => {
    expect(negotiateLanguage("fi-FI, fi;q=0.9, sv;q=0.8")).toBe("sv");
  });

  it("never takes a language the browser refuses with a zero weight", () => {
    expect(negotiateLanguage("de;q=0, it;q=0.1")).toBe("it");
  });

  it("finds nothing in an empty, wildcard or unknown header", () => {
    expect(negotiateLanguage(null)).toBeUndefined();
    expect(negotiateLanguage("")).toBeUndefined();
    expect(negotiateLanguage("*")).toBeUndefined();
    expect(negotiateLanguage("fi, da")).toBeUndefined();
  });

  it("reads a range without a valid weight as weighing 1", () => {
    expect(negotiateLanguage("es;q=abc, ja;q=0.9")).toBe("es");
  });
});
