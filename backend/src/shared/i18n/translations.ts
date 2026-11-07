import { z } from "zod";

import { type TargetLanguage, targetLanguages } from "#shared/i18n/languages";

/**
 * How many times longer than its source a translation may be: German, for one, runs well past
 * Russian, and a translation the server made must pass when the form sends it back.
 */
const translationLengthFactor = 2;

/**
 * One text in one language as stored in Firestore. `source` is the text it was made from: when the
 * text in the source language differs from it, the translation is out of date.
 */
const storedTranslationSchema = z.object({
  text: z.string(),
  source: z.string(),
  /** Whether a person wrote the text: only an explicit request replaces it. */
  edited: z.boolean(),
});

/**
 * The translations of a resource as stored in Firestore, by language and then by field. Only the
 * shape is checked, so dropping a language later never makes a saved resource unreadable.
 */
export const storedTranslationsSchema = z.record(
  z.string(),
  z.record(z.string(), storedTranslationSchema),
);

export type StoredTranslation = z.infer<typeof storedTranslationSchema>;
export type StoredTranslations = z.infer<typeof storedTranslationsSchema>;

function translatedTextSchema(maxLength: number) {
  return z
    .string()
    .trim()
    .min(1)
    .max(maxLength * translationLengthFactor)
    .nullable()
    .optional();
}

/**
 * The translations as the client sends them, for the fields named in `maxLengths` with the limit
 * of each in the source language, and for items of a list by their ids, with the limit
 * `maxItemLength`. A text is what the form shows: one that differs from the saved text is a
 * person's edit. Null asks for a new translation, replacing even a person's edit. A field left out
 * keeps its translation until its source changes.
 */
export function translationsBodySchema<Field extends string>(
  maxLengths: Record<Field, number>,
  maxItemLength?: number,
) {
  const fields = Object.keys(maxLengths) as Field[];
  const texts = Object.fromEntries(
    fields.map((field) => [field, translatedTextSchema(maxLengths[field])]),
  );
  const language: z.ZodType<Partial<Record<string, string | null>>> =
    maxItemLength === undefined
      ? z.strictObject(texts)
      : z.object(texts).catchall(translatedTextSchema(maxItemLength));

  return z.partialRecord(z.enum(targetLanguages), language);
}

/** The texts of the items of a list, by the ids their translations are stored under. */
export function textsById<Item extends { id: string }>(
  items: readonly Item[],
  text: (item: Item) => string,
): Record<string, string> {
  return Object.fromEntries(items.map((item) => [item.id, text(item)]));
}

/** What the client sent for each language and field; see translationsBodySchema. */
export type TranslationsBody = Partial<
  Record<TargetLanguage, Partial<Record<string, string | null>>>
>;

/** A text to translate. */
export interface TranslationRequest {
  field: string;
  language: TargetLanguage;
}

/** The translations to save as they are, and those to make; see planTranslations. */
export interface TranslationPlan {
  kept: StoredTranslations;
  requests: TranslationRequest[];
}

function storeTranslation(
  translations: StoredTranslations,
  language: string,
  field: string,
  translation: StoredTranslation,
): void {
  translations[language] = { ...translations[language], [field]: translation };
}

/**
 * Decides what becomes of every translation when a resource is saved. `sources` are the texts in
 * the source language by field, as they are being saved. A person's edit stays even when its source
 * changes, and shows as out of date. A field with no source text has no translation. A translation
 * being replaced is kept for now, so that it stays if making the new one fails.
 */
export function planTranslations(
  sources: Record<string, string>,
  saved: StoredTranslations,
  sent: TranslationsBody,
): TranslationPlan {
  const kept: StoredTranslations = {};
  const requests: TranslationRequest[] = [];

  for (const language of targetLanguages) {
    for (const [field, source] of Object.entries(sources)) {
      if (source === "") {
        continue;
      }

      const current = saved[language]?.[field];
      const text = sent[language]?.[field];

      if (typeof text === "string" && text !== current?.text) {
        storeTranslation(kept, language, field, { text, source, edited: true });
        continue;
      }

      if (current) {
        storeTranslation(kept, language, field, current);
      }

      const isUpToDate = current?.source === source || current?.edited === true;

      if (text === null || !isUpToDate) {
        requests.push({ field, language });
      }
    }
  }

  return { kept, requests };
}

/** What a translation shows the person: who wrote it, and whether its source changed since. */
export type TranslationStatus = "auto" | "edited" | "outdated";

/** One text in one language as the API returns it. */
export interface Translation {
  status: TranslationStatus;
  text: string;
}

/** The translations as the API returns them; a text not translated yet is left out. */
export type Translations = Record<string, Record<string, Translation>>;

function toStatus({ edited, source }: StoredTranslation, current: string): TranslationStatus {
  if (source !== current) {
    return "outdated";
  }

  return edited ? "edited" : "auto";
}

/**
 * The stored translations as the API returns them, for the texts `sources` as they are saved now:
 * a language or a field no longer in use is left out.
 */
export function toTranslations(
  stored: StoredTranslations,
  sources: Record<string, string>,
): Translations {
  const translations: Translations = {};

  for (const language of targetLanguages) {
    for (const [field, source] of Object.entries(sources)) {
      const translation = stored[language]?.[field];

      if (translation) {
        translations[language] = {
          ...translations[language],
          [field]: { status: toStatus(translation, source), text: translation.text },
        };
      }
    }
  }

  return translations;
}
