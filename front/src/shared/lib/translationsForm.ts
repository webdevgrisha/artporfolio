import type { ResourceTranslations, TranslationStatus } from "@/shared/api/translations";

const statusLabels: Record<TranslationStatus, string> = {
  auto: "Автоперевод",
  edited: "Исправлено вручную",
  outdated: "Устарел: русский текст изменился",
  pending: "Переводится…",
};

interface TranslationHintParams {
  /** Whether the server gave up on the texts still missing. */
  failed: boolean;
  /** The Russian text as last saved. */
  original: string;
  /** Of the saved translation; undefined when there is none. */
  status: TranslationStatus | undefined;
  /** The field as the form holds it now. */
  text: string;
}

function getState({ failed, status, text }: TranslationHintParams): string {
  if (failed && (status === undefined || status === "pending")) {
    return "Не удалось перевести";
  }

  if (text === "" && status !== undefined) {
    return "Переведётся при сохранении";
  }

  if (status === undefined) {
    return text === "" ? "Переводится…" : "Написано вручную";
  }

  return statusLabels[status];
}

/** What a translation field says about its text, and the Russian text to compare it with. */
export function getTranslationHint(params: TranslationHintParams): string {
  return `${getState(params)}. Оригинал: ${params.original}`;
}

/** What needs attention in one language: the mark the list of languages shows beside it. */
export function getLanguageMark(
  { failed, sources, translations }: ResourceTranslations,
  language: string,
): string | null {
  const texts = Object.entries(sources)
    .filter(([, source]) => source !== "")
    .map(([key]) => translations[language]?.[key]?.status);
  const isIncomplete = texts.some((status) => status === undefined || status === "pending");

  if (isIncomplete) {
    return failed ? "не переведено" : "переводится";
  }

  return texts.includes("outdated") ? "устарело" : null;
}
