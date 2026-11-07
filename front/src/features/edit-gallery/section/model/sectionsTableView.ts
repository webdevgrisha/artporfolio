import type { GallerySectionSummary } from "@/entities/gallery";
import { containsText } from "@/shared/lib/containsText";

/**
 * The columns the table sorts by, as named in the address. The sections stand by title already, so
 * only the numbers of subsections and of works give another order.
 */
export const sectionsSortableColumns = ["subsections", "works"] as const;

/** Whether the title of the section or of one of its subsections contains the query, in any case. */
export function matchesSectionQuery(
  { subsections, title }: GallerySectionSummary,
  query: string,
): boolean {
  return [title, ...subsections.map((subsection) => subsection.title)].some((text) =>
    containsText(text, query),
  );
}
