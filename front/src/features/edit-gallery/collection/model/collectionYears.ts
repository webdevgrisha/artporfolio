import type { GalleryCollectionSummary } from "@/entities/gallery";

/** The years of the collection as the admin reads them: «2022–2025», or «2024» for one year. */
export function formatCollectionYears({
  endYear,
  startYear,
}: Pick<GalleryCollectionSummary, "endYear" | "startYear">): string {
  return endYear === null ? String(startYear) : `${String(startYear)}–${String(endYear)}`;
}
