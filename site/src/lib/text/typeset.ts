import Typograf from "typograf";

import type { Language } from "@/lib/i18n/languages";

/**
 * The languages whose rules keep a short preposition or conjunction from ending a line, which
 * Typograf sets right, with their quotes: the Slavic ones of the site. In others it would get
 * the rules wrong, such as the space French puts before «!», or there are none: their texts are
 * left as they are.
 */
const typografLocales: Partial<Record<Language, string>> = {
  be: "be",
  cs: "cs",
  pl: "pl",
  ru: "ru",
  sk: "sk",
  uk: "uk",
};

const typografs = new Map<Language, Typograf>();

function typografOf(language: Language): Typograf | undefined {
  const locale = typografLocales[language];

  if (locale === undefined) return undefined;

  let typograf = typografs.get(language);

  if (!typograf) {
    // English after the language, for the names and terms in Latin letters within its texts.
    typograf = new Typograf({ locale: [locale, "en-US"] });
    typografs.set(language, typograf);
  }

  return typograf;
}

/**
 * A text of the page set by the typographic rules of its language: a no-break space after a short
 * word, so it never ends a line, the quotes, dashes and ellipsis of the language. The result is
 * plain text, not HTML, which the page escapes as any other.
 */
export function typeset(language: Language, text: string): string {
  return typografOf(language)?.execute(text) ?? text;
}
