import { capitalized } from "@/lib/text/capitalized";

import type { Language } from "./languages";
import { languageTag } from "./languageTag";

/**
 * The name of a language in that language, as a switch of languages lists it: «Deutsch»,
 * «Polski», «Українська», so a visitor finds their own whatever the page is in. It comes from the
 * data of `Intl` (CLDR) and starts with a capital, as an item of a list does.
 */
export function languageName(language: Language): string {
  const tag = languageTag(language);
  const name = new Intl.DisplayNames([tag], { type: "language" }).of(language) ?? language;

  return capitalized(name, tag);
}
