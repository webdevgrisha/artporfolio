import { translateTexts } from "#shared/i18n/deepl";
import { type TargetLanguage, targetLanguages } from "#shared/i18n/languages";
import type { StoredTranslation, TranslationRequest } from "#shared/i18n/translations";

/** DeepL limits how often an account may ask: a burst of requests is refused with 429. */
const maxParallelRequests = 4;

/** A translation made by the translator. */
interface MadeTranslation {
  key: string;
  language: TargetLanguage;
  translation: StoredTranslation;
}

/** What the translator made, and the errors of the languages it failed on. */
interface TranslationResult {
  errors: unknown[];
  made: MadeTranslation[];
}

async function translateLanguage(
  language: TargetLanguage,
  keys: string[],
  sources: Record<string, string>,
): Promise<MadeTranslation[]> {
  const texts = keys.map((key) => sources[key] as string);
  const translated = await translateTexts(texts, language);

  return keys.map((key, index) => ({
    key,
    language,
    translation: {
      edited: false,
      source: texts[index] as string,
      text: translated[index] as string,
    },
  }));
}

/** Makes the translations `requests` asks for, one request per language, a few at a time. */
export async function translateAll(
  sources: Record<string, string>,
  requests: TranslationRequest[],
): Promise<TranslationResult> {
  const languages = targetLanguages.filter((language) =>
    requests.some((request) => request.language === language),
  );
  const result: TranslationResult = { errors: [], made: [] };

  for (let start = 0; start < languages.length; start += maxParallelRequests) {
    const settled = await Promise.allSettled(
      languages.slice(start, start + maxParallelRequests).map((language) =>
        translateLanguage(
          language,
          requests.filter((request) => request.language === language).map(({ key }) => key),
          sources,
        ),
      ),
    );

    for (const outcome of settled) {
      if (outcome.status === "fulfilled") {
        result.made.push(...outcome.value);
      } else {
        result.errors.push(outcome.reason);
      }
    }
  }

  return result;
}
