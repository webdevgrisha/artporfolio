import type { WorkUsage, WorkUsages } from "@/entities/gallery";

/** The usage of an item no work names. */
export const noWorkUsage: WorkUsage = { count: 0, onlyCount: 0 };

/** The usage of the item `id`; none for an item the counts don't know yet, such as a new one. */
export function usageOf(usages: WorkUsages, id: string): WorkUsage {
  return usages[id] ?? noWorkUsage;
}

const pluralRules = new Intl.PluralRules("ru");

/** The word for `count` among three forms, as in «1 работа», «2 работы», «5 работ». */
function pluralForm(count: number, one: string, few: string, many: string): string {
  const plural = pluralRules.select(count);

  return plural === "one" ? one : plural === "few" ? few : many;
}

/** E.g. «1 работа», «12 работ». */
export function formatWorkCount(count: number): string {
  return `${String(count)} ${pluralForm(count, "работа", "работы", "работ")}`;
}

/** How a removal confirmation names the items of a list. */
export interface WorkUsageNames {
  /** The other items, as in «других материалов нет». */
  others: string;
  /** One item to choose instead, as in «выберете им материал». */
  item: string;
}

/**
 * What removing the items does to the works that name them, e.g. «Есть у 12 работ. У 2 из них
 * других материалов нет — их не получится сохранить, пока не выберете им материал.»
 */
export function describeWorkUsage({ count, onlyCount }: WorkUsage, names: WorkUsageNames): string {
  const used = `Есть у ${String(count)} ${pluralForm(count, "работы", "работ", "работ")}.`;

  if (onlyCount === 0) return used;

  if (onlyCount === count) {
    return count === 1
      ? `${used} Других ${names.others} у неё нет — её не получится сохранить, пока не выберете ей ${names.item}.`
      : `${used} Других ${names.others} у них нет — их не получится сохранить, пока не выберете им ${names.item}.`;
  }

  return `${used} У ${String(onlyCount)} из них других ${names.others} нет — их не получится сохранить, пока не выберете им ${names.item}.`;
}
