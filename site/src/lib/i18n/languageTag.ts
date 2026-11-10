import type { Language } from "./languages";

/** The variants the texts are translated into, as DeepL names them on the backend. */
const variants: Partial<Record<Language, string>> = {
  pt: "pt-BR",
  zh: "zh-Hans",
};

/**
 * The BCP 47 tag of a language for `lang` and `hreflang`: screen readers pick their voice and
 * browsers their fonts by it, so it names the variant the texts are in, such as `zh-Hans`.
 */
export function languageTag(language: Language): string {
  return variants[language] ?? language;
}
