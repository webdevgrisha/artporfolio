import type { GallerySectionSummary, WorkUsage } from "@/entities/gallery";
import { pluralForm } from "@/shared/lib/pluralForm";

import { describeWorkUsage } from "../../model/workUsage";

/**
 * What the deletion of the section takes from the site, its subsections included, and what it
 * leaves the works that were in it.
 */
export function describeSectionDeletion(
  { subsections }: GallerySectionSummary,
  usage: WorkUsage,
): string {
  const count = subsections.length;
  const noun = pluralForm(count, "подраздел", "подраздела", "подразделов");
  const removal =
    count === 0
      ? "Раздел пропадёт с сайта."
      : `Раздел и ${String(count)} ${noun} пропадут с сайта.`;
  const works =
    usage.count === 0 ? "" : ` ${describeWorkUsage(usage, { item: "раздел", others: "разделов" })}`;

  return `${removal}${works} Это нельзя отменить.`;
}
