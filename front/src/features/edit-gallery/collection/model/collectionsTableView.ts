import type { GalleryCollectionSummary } from "@/entities/gallery";
import { containsText } from "@/shared/lib/containsText";

/** The columns the table sorts by, as named in the address. */
export const collectionsSortableColumns = ["position", "title", "years", "works"] as const;

/** Whether the title of the collection contains the query, in any case. */
export function matchesCollectionQuery(
  { title }: GalleryCollectionSummary,
  query: string,
): boolean {
  return containsText(title, query);
}

/** By the year the collection was finished, then by its start, the earlier first. */
export function compareCollectionYears(
  a: GalleryCollectionSummary,
  b: GalleryCollectionSummary,
): number {
  return (a.endYear ?? a.startYear) - (b.endYear ?? b.startYear) || a.startYear - b.startYear;
}
