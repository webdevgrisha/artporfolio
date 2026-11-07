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
  /** Of the saved translation; undefined when there is none. */
  status: TranslationStatus | undefined;
  /** The field as the form holds it now. */
  text: string;
}

/** What a translation field says about its text. */
export function getTranslationHint({ failed, status, text }: TranslationHintParams): string {
  if (failed && (status === undefined || status === "pending")) {
    return "Не удалось перевести";
  }

  if (status === undefined) {
    return text === "" ? "Переводится…" : "Написано вручную";
  }

  return statusLabels[status];
}

/** The statuses of the texts of one language; undefined for a text not translated yet. */
function statusesOf(
  { sources, translations }: ResourceTranslations,
  language: string,
): (TranslationStatus | undefined)[] {
  return Object.entries(sources)
    .filter(([, source]) => source !== "")
    .map(([key]) => translations[language]?.[key]?.status);
}

function countIncomplete(statuses: readonly (TranslationStatus | undefined)[]): number {
  return statuses.filter((status) => status === undefined || status === "pending").length;
}

/** What needs attention in one language: the mark the list of languages shows beside it. */
export function getLanguageMark(data: ResourceTranslations, language: string): string | null {
  const statuses = statusesOf(data, language);

  if (countIncomplete(statuses) > 0) {
    return data.failed ? "не переведено" : "переводится";
  }

  return statuses.includes("outdated") ? "устарело" : null;
}

/** How many texts of the language need attention, as a line beside the chosen language. */
export function getLanguageSummary(data: ResourceTranslations, language: string): string | null {
  const statuses = statusesOf(data, language);
  const incomplete = countIncomplete(statuses);
  const outdated = statuses.filter((status) => status === "outdated").length;

  if (incomplete > 0) {
    return `${data.failed ? "Не переведено" : "Переводится"}: ${String(incomplete)}`;
  }

  return outdated > 0 ? `Устарело: ${String(outdated)}` : null;
}
