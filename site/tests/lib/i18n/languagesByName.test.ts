import { describe, expect, it } from "vitest";

import { languages } from "@/lib/i18n/languages";
import { languagesByName } from "@/lib/i18n/languagesByName";

describe("languagesByName", () => {
  it("lists every language once", () => {
    expect([...languagesByName()].sort()).toEqual([...languages].sort());
  });

  it("puts the Latin script first, alphabetically, then the other scripts in blocks", () => {
    const order = languagesByName();

    expect(order.slice(0, 4)).toEqual(["cs", "de", "en", "es"]);
    expect(order.indexOf("tr")).toBeLessThan(order.indexOf("el"));
    expect(order.indexOf("el")).toBeLessThan(order.indexOf("be"));
    expect(order.slice(order.indexOf("be"), order.indexOf("be") + 3)).toEqual(["be", "ru", "uk"]);
    expect(order.indexOf("uk")).toBeLessThan(order.indexOf("ar"));
  });
});
