import { warn } from "firebase-functions/logger";

import { translateTexts } from "#shared/i18n/deepl";
import { type TargetLanguage, targetLanguages } from "#shared/i18n/languages";
import {
  planTranslations,
  type StoredTranslations,
  type TranslationRequest,
  type TranslationsBody,
} from "#shared/i18n/translations";

/** Makes the translations of one language and stores them in `translations`. */
async function translateLanguage(
  language: TargetLanguage,
  fields: string[],
  sources: Record<string, string>,
  translations: StoredTranslations,
): Promise<void> {
  const texts = await translateTexts(
    fields.map((field) => sources[field] as string),
    language,
  );

  fields.forEach((field, index) => {
    const source = sources[field] as string;
    const text = texts[index] as string;

    translations[language] = {
      ...translations[language],
      [field]: { text, source, edited: false },
    };
  });
}

function fieldsOf(requests: TranslationRequest[], language: TargetLanguage): string[] {
  return requests.filter((request) => request.language === language).map(({ field }) => field);
}

/**
 * The translations to save with a resource, which makes those it needs; see planTranslations. Call
 * it outside a transaction, which may run several times. A language the translator fails on keeps
 * what it had: the save goes through, the texts show as out of date or missing, and the next save
 * asks for them again.
 */
export async function saveTranslations(
  sources: Record<string, string>,
  saved: StoredTranslations,
  sent: TranslationsBody,
): Promise<StoredTranslations> {
  const { kept, requests } = planTranslations(sources, saved, sent);
  const languages = targetLanguages.filter((language) => fieldsOf(requests, language).length > 0);
  const results = await Promise.allSettled(
    languages.map((language) =>
      translateLanguage(language, fieldsOf(requests, language), sources, kept),
    ),
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      warn("Could not translate", { error: result.reason, language: languages[index] });
    }
  });

  return kept;
}
