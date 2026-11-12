import { capitalized } from "@/lib/text/capitalized";

import type { Language } from "./languages";
import { languageTag } from "./languageTag";

/**
 * The name of a currency in the language of the page, by its ISO 4217 code: «EUR» → «Euro» in
 * English, «Евро» in Russian. It comes from the data of `Intl` (CLDR) and starts with a capital, as
 * an item of a list does.
 */
export function currencyName(code: string, language: Language): string {
  const tag = languageTag(language);
  const name = new Intl.DisplayNames([tag], { type: "currency" }).of(code) ?? code;

  return capitalized(name, tag);
}
