import { describe, expect, it } from "vitest";

import { typeset } from "@/lib/text/typeset";

const nbsp = " ";

describe("typeset", () => {
  it("keeps a short word on the line of the word after it", () => {
    expect(typeset("ru", "Свяжитесь со мной")).toBe(`Свяжитесь со${nbsp}мной`);
    expect(typeset("cs", "Napište mi a v pondělí")).toBe(
      `Napište mi${nbsp}a${nbsp}v${nbsp}pondělí`,
    );
  });

  it("sets the quotes of the language", () => {
    expect(typeset("ru", 'Серия "Море"')).toBe("Серия «Море»");
    expect(typeset("pl", 'Seria "Morze"')).toBe("Seria „Morze”");
  });

  it("returns plain text, which the page escapes", () => {
    expect(typeset("ru", "Цвет & форма")).toBe("Цвет & форма");
  });

  it("leaves a language without such rules as it is", () => {
    expect(typeset("fr", "Bonjour ! Ça va ?")).toBe("Bonjour ! Ça va ?");
    expect(typeset("en", 'Get in "touch"')).toBe('Get in "touch"');
  });
});
