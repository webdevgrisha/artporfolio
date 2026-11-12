import { describe, expect, it } from "vitest";

import { languageName } from "@/lib/i18n/languageName";
import { languages } from "@/lib/i18n/languages";

describe("languageName", () => {
  it("names a language in that language, with a capital", () => {
    expect(languageName("en")).toBe("English");
    expect(languageName("de")).toBe("Deutsch");
    expect(languageName("es")).toBe("Español");
    expect(languageName("uk")).toBe("Українська");
  });

  it("names the language, not the variant the texts are in", () => {
    expect(languageName("pt")).toBe("Português");
    expect(languageName("zh")).toBe("中文");
  });

  it("gives every language of the site a name of its own", () => {
    const names = languages.map(languageName);

    expect(new Set(names).size).toBe(languages.length);
    for (const [index, name] of names.entries()) expect(name).not.toBe(languages[index]);
  });
});
