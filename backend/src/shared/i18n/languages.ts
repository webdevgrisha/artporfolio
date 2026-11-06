/** The language the artist writes in; every other language is translated from it. */
export const sourceLanguage = "ru";

/** The languages of the site other than the source one, by ISO 639-1 code. */
export const targetLanguages = [
  "en",
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

export type TargetLanguage = (typeof targetLanguages)[number];
