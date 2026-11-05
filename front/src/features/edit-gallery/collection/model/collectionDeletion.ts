import { pluralForm } from "@/shared/lib/pluralForm";

/** What deleting a collection of `count` works does to them: they stay in the gallery. */
export function describeCollectionDeletion(count: number): string {
  if (count === 0) return "Коллекция пропадёт с сайта. Это нельзя отменить.";

  const noun = pluralForm(count, "работа", "работы", "работ");
  const verb = pluralForm(count, "останется", "останутся", "останутся");

  return `Коллекция пропадёт с сайта, её ${String(count)} ${noun} ${verb} в галерее без коллекции. Это нельзя отменить.`;
}
