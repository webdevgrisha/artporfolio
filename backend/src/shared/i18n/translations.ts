import { z } from "zod";

import { type TargetLanguage, targetLanguages } from "#shared/i18n/languages";

/**
 * One text in one language as stored in Firestore. `source` is the text it was made from: when the
 * text in the source language differs from it, the translation is out of date.
 */
const storedTranslationSchema = z.object({
  text: z.string(),
  source: z.string(),
  /** Whether a person wrote the text: nothing replaces it unless a person asks. */
  edited: z.boolean(),
});

/**
 * The translations of a resource as stored in Firestore, by language and then by key. Only the
 * shape is checked, so dropping a language later never makes saved translations unreadable.
 */
export const storedTranslationsSchema = z.record(
  z.string(),
  z.record(z.string(), storedTranslationSchema),
);

export type StoredTranslation = z.infer<typeof storedTranslationSchema>;
export type StoredTranslations = z.infer<typeof storedTranslationsSchema>;

/** The texts of the items of a list, by the ids their translations are stored under. */
export function textsById<Item extends { id: string }>(
  items: readonly Item[],
  text: (item: Item) => string,
): Record<string, string> {
  return Object.fromEntries(items.map((item) => [item.id, text(item)]));
}

/** A text to translate. */
export interface TranslationRequest {
  key: string;
  language: TargetLanguage;
}

/** The translations to keep, and those to make; see planTranslations. */
interface TranslationPlan {
  kept: StoredTranslations;
  requests: TranslationRequest[];
}

export function storeTranslation(
  translations: StoredTranslations,
  language: string,
  key: string,
  translation: StoredTranslation,
): void {
  translations[language] = { ...translations[language], [key]: translation };
}

/**
 * What becomes of the translations when the texts in the source language are `sources`. A person's
 * edit stays even when its source changes, and shows as out of date. A key with no source text has
 * no translation. A translation being replaced is kept for now, so that the site has something to
 * show until the new one is made.
 */
export function planTranslations(
  sources: Record<string, string>,
  saved: StoredTranslations,
): TranslationPlan {
  const kept: StoredTranslations = {};
  const requests: TranslationRequest[] = [];

  for (const language of targetLanguages) {
    for (const [key, source] of Object.entries(sources)) {
      if (source === "") {
        continue;
      }

      const current = saved[language]?.[key];

      if (current) {
        storeTranslation(kept, language, key, current);
      }

      if (current?.source !== source && current?.edited !== true) {
        requests.push({ key, language });
      }
    }
  }

  return { kept, requests };
}

/**
 * What a translation shows the person: made by the translator or by a person, a person's text of an
 * earlier source, or an old text the translator is about to replace.
 */
export type TranslationStatus = "auto" | "edited" | "outdated" | "pending";

/** One text in one language as the API returns it. */
interface Translation {
  status: TranslationStatus;
  text: string;
}

/** The translations as the API returns them; a text not translated yet is left out. */
export type Translations = Record<string, Record<string, Translation>>;

function toStatus({ edited, source }: StoredTranslation, current: string): TranslationStatus {
  if (source === current) {
    return edited ? "edited" : "auto";
  }

  return edited ? "outdated" : "pending";
}

/** The stored translations of the texts `sources` as the API returns them. */
export function toTranslations(
  stored: StoredTranslations,
  sources: Record<string, string>,
): Translations {
  const translations: Translations = {};

  for (const language of targetLanguages) {
    for (const [key, source] of Object.entries(sources)) {
      const translation = stored[language]?.[key];

      if (translation) {
        translations[language] = {
          ...translations[language],
          [key]: { status: toStatus(translation, source), text: translation.text },
        };
      }
    }
  }

  return translations;
}
