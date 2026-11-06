import type { TranslationStatus, Translations } from "@/shared/api/translations";

/** The texts of a work that are translated, under the names the server gives them. */
export const workTranslatedFields = ["title", "description", "city", "alt"] as const;

export type WorkTranslatedField = (typeof workTranslatedFields)[number];

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
