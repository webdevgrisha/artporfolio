/** The languages of the site other than Russian; mirrors backend/src/shared/i18n/languages.ts. */
export const targetLanguages = ["en", "pl", "uk", "be", "de", "fr", "es", "it", "pt"] as const;

export type TargetLanguage = (typeof targetLanguages)[number];

export const languageNames: Record<TargetLanguage, string> = {
  be: "Белорусский",
  de: "Немецкий",
  en: "Английский",
  es: "Испанский",
  fr: "Французский",
  it: "Итальянский",
  pl: "Польский",
  pt: "Португальский",
  uk: "Украинский",
};
