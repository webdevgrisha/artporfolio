/**
 * The languages of the site, by the code in its URLs: ISO 639-1, as the backend names them in
 * `backend/src/shared/i18n/languages.ts`. The artist writes in Russian; the rest are translations.
 */
export const languages = [
  "en",
  "ru",
  "pl",
  "uk",
  "be",
  "de",
  "fr",
  "es",
  "it",
  "pt",
  "zh",
  "ja",
  "ko",
  "ar",
  "tr",
  "nl",
  "sv",
  "cs",
  "sk",
  "lt",
  "hu",
  "ro",
  "el",
  "id",
  "hi",
  "vi",
] as const;

export type Language = (typeof languages)[number];

/** For a visitor whose browser asks for none of the languages of the site. */
export const defaultLanguage: Language = "en";

export function isLanguage(value: unknown): value is Language {
  return languages.includes(value as Language);
}
