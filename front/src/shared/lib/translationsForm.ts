import { z } from "zod";

import type { Translations, TranslationsBody } from "@/shared/api/translations";
import { type TargetLanguage, targetLanguages } from "@/shared/config/languages";

// Mirrors the server rule in backend/src/shared/i18n/translations.ts.
export const translationLengthFactor = 2;

/** The texts a form holds by language and then by field; an empty one is to be translated anew. */
export type TranslationValues<Field extends string> = Record<TargetLanguage, Record<Field, string>>;

/** The translation fields of a form, by the limit of each field in Russian. */
export function translationValuesSchema<Field extends string>(maxLengths: Record<Field, number>) {
  const fields = Object.keys(maxLengths) as Field[];
  const texts = Object.fromEntries(
    fields.map((field) => {
      const maxLength = maxLengths[field] * translationLengthFactor;

      return [
        field,
        z
          .string()
          .trim()
          .max(maxLength, `Не длиннее ${String(maxLength)} символов`),
      ];
    }),
  ) as Record<Field, z.ZodString>;
  const languages = Object.fromEntries(
    targetLanguages.map((language) => [language, z.object(texts)]),
  ) as Record<TargetLanguage, z.ZodObject<Record<Field, z.ZodString>>>;

  return z.object(languages);
}

/** The saved translations as a form holds them; a text not translated yet is empty. */
export function toTranslationValues<Field extends string>(
  translations: Translations,
  fields: readonly Field[],
): TranslationValues<Field> {
  return Object.fromEntries(
    targetLanguages.map((language) => [
      language,
      Object.fromEntries(
        fields.map((field) => [field, translations[language]?.[field]?.text ?? ""]),
      ),
    ]),
  ) as TranslationValues<Field>;
}

/** The translations the form holds as the server takes them. */
export function toTranslationsBody<Field extends string>(
  values: TranslationValues<Field>,
): TranslationsBody {
  return Object.fromEntries(
    Object.entries<Record<Field, string>>(values).map(([language, texts]) => [
      language,
      Object.fromEntries(
        Object.entries<string>(texts).map(([field, text]) => [field, text === "" ? null : text]),
      ),
    ]),
  );
}
