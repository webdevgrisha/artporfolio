import { defaultLanguage, isLanguage, type Language } from "./languages";

/**
 * The language a path is in, by its first segment: `/pl/contact` → `pl`. A path outside the
 * languages, such as a mistyped one, is in English.
 */
export function languageOfPath(pathname: string): Language {
  const [first] = pathname.split("/").filter(Boolean);

  return isLanguage(first) ? first : defaultLanguage;
}
