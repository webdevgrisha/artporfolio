import { languageName } from "./languageName";
import { type Language, languages } from "./languages";

/**
 * The languages of the site in the order a switch lists them: by their own names, as Unicode
 * sorts text in no language in particular (the root collation of CLDR). That groups them by
 * script, Latin first, then Greek, Cyrillic, Arabic, Devanagari, Hangul and Han, and alphabetically
 * within each, so a visitor finds their own by the look of its letters, then by the first one.
 */
export function languagesByName(): Language[] {
  const collator = new Intl.Collator("und");

  return [...languages].sort((a, b) => collator.compare(languageName(a), languageName(b)));
}
