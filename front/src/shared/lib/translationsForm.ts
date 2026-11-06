import { z } from "zod";

import type { TranslationStatus, Translations, TranslationsBody } from "@/shared/api/translations";
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

const statusLabels: Record<TranslationStatus, string> = {
  auto: "Автоперевод",
  edited: "Исправлено вручную",
  outdated: "Устарел: русский текст изменился",
};

interface TranslationHintParams {
  /** The field as the form holds it now. */
  text: string;
  /** The Russian text as the form holds it now. */
  original: string;
  /** Of the saved translation; undefined when there is none. */
  status: TranslationStatus | undefined;
}

/** What a translation field says about its text, and the Russian text to compare it with. */
export function getTranslationHint({ original, status, text }: TranslationHintParams): string {
  if (original === "") {
    return "На русском текста нет, поэтому и перевод не нужен";
  }

  const state =
    text === ""
      ? "Переведётся при сохранении"
      : status === undefined
        ? "Написано вручную"
        : statusLabels[status];

  return `${state}. Оригинал: ${original}`;
}

/** How many saved texts of `language` were made from an earlier Russian text. */
export function countOutdated(translations: Translations, language: string): number {
  return Object.values(translations[language] ?? {}).filter(({ status }) => status === "outdated")
    .length;
}
