import { z } from "zod";

import type { TranslationStatus, Translations, TranslationsBody } from "@/shared/api/translations";
import { type TargetLanguage, targetLanguages } from "@/shared/config/languages";

// Mirrors the server rule in backend/src/shared/i18n/translations.ts.
export const translationLengthFactor = 2;

/** The texts a form holds by language and then by key; an empty one is translated anew on save. */
export type TranslationValues = Record<TargetLanguage, Record<string, string>>;

function translatedTextSchema(maxLength: number) {
  const limit = maxLength * translationLengthFactor;

  return z
    .string()
    .trim()
    .max(limit, `Не длиннее ${String(limit)} символов`);
}

/**
 * The translation fields of a form, by the limit of each field in Russian, and for items of a list,
 * which go by their ids, by the limit `maxItemLength`.
 */
export function translationValuesSchema(
  maxLengths: Record<string, number>,
  maxItemLength?: number,
): z.ZodType<TranslationValues, TranslationValues> {
  const texts = Object.fromEntries(
    Object.entries(maxLengths).map(([field, maxLength]) => [
      field,
      translatedTextSchema(maxLength),
    ]),
  );
  const language =
    maxItemLength === undefined
      ? z.object(texts)
      : z.object(texts).catchall(translatedTextSchema(maxItemLength));

  return z.object(
    Object.fromEntries(targetLanguages.map((target) => [target, language])),
  ) as unknown as z.ZodType<TranslationValues, TranslationValues>;
}

/** The saved translations as a form holds them; a text not translated yet is empty. */
export function toTranslationValues(
  translations: Translations,
  keys: readonly string[],
): TranslationValues {
  return Object.fromEntries(
    targetLanguages.map((language) => [
      language,
      Object.fromEntries(keys.map((key) => [key, translations[language]?.[key]?.text ?? ""])),
    ]),
  ) as TranslationValues;
}

/** The translations the form holds as the server takes them. */
export function toTranslationsBody(values: TranslationValues): TranslationsBody {
  return Object.fromEntries(
    Object.entries(values).map(([language, texts]) => [
      language,
      Object.fromEntries(
        Object.entries(texts).map(([key, text]) => [key, text === "" ? null : text]),
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
