import type { GalleryWorkSummary } from "@/entities/gallery";

/** The columns the table sorts by, as named in the address. */
export const worksSortableColumns = [
  "position",
  "title",
  "collection",
  "size",
  "price",
  "date",
  "place",
] as const;

/** By the area of the work, the smaller first; works of one area by the width. */
export function compareWorkSizes(
  { size: a }: GalleryWorkSummary,
  { size: b }: GalleryWorkSummary,
): number {
  return a.width * a.height - b.width * b.height || a.width - b.width;
}

/** By the month the work was finished, the earlier first. */
export function compareWorkDates(a: GalleryWorkSummary, b: GalleryWorkSummary): number {
  return a.year - b.year || a.month - b.month;
}
