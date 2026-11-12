import { firestore } from "#shared/firebase/firestore";
import { type Language, sourceLanguage } from "#shared/i18n/languages";
import { readResource, resourceDocument } from "#shared/i18n/translation-document";
import type { StoredTranslations } from "#shared/i18n/translations";

/** The translations of the resource, or none when the texts are wanted in the source language. */
export async function readTranslations(
  resource: string,
  language: Language,
): Promise<StoredTranslations> {
  if (language === sourceLanguage) {
    return {};
  }

  return readResource(await resourceDocument(resource).get()).translations;
}

/**
 * The text of `key` for a visitor in `language`: its translation, even one made from an older
 * source, as that is closer than any other language; else the English one, which more visitors
 * read than the source language; else the source text itself.
 */
export function translatedText(
  translations: StoredTranslations,
  language: Language,
  key: string,
  source: string,
): string {
  if (language === sourceLanguage) {
    return source;
  }

  return translations[language]?.[key]?.text || translations.en?.[key]?.text || source;
}

/**
 * The translations of each resource in one read, in the order of `resources`, or none when the
 * texts are wanted in the source language.
 */
export async function readEachTranslations(
  resources: readonly string[],
  language: Language,
): Promise<StoredTranslations[]> {
  if (language === sourceLanguage || resources.length === 0) {
    return resources.map(() => ({}));
  }

  const snapshots = await firestore().getAll(...resources.map(resourceDocument));

  return snapshots.map((snapshot) => readResource(snapshot).translations);
}
