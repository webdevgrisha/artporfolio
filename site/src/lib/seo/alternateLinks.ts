import { defaultLanguage, type Language, languages } from "@/lib/i18n/languages";
import { languageTag } from "@/lib/i18n/languageTag";
import { localizedPath } from "@/lib/site/localizedPath";

export interface AlternateLink {
  /** A language tag, or `x-default` for a visitor whose language the site does not have. */
  hreflang: string;
  href: string;
}

/**
 * The same page in every language, for `<link rel="alternate">` and the sitemap: a search engine
 * shows each visitor the page in their language. A visitor of another language gets English.
 */
export function alternateLinks(path: string, siteUrl: string): AlternateLink[] {
  const url = (language: Language) => new URL(localizedPath(language, path), siteUrl).href;

  return [
    ...languages.map((language) => ({ href: url(language), hreflang: languageTag(language) })),
    { href: url(defaultLanguage), hreflang: "x-default" },
  ];
}
