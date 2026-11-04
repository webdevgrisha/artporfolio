import type { GalleryWork } from "@/entities/gallery";

/** The columns the table sorts by, as named in the address. */
export const worksSortableColumns = ["position", "title", "size", "price", "date"] as const;

/** Whether the title of the work contains the query, in any case. */
export function matchesWorkQuery({ title }: GalleryWork, query: string): boolean {
  return title.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"));
}

/** By the area of the work, the smaller first; works of one area by the width. */
export function compareWorkSizes({ size: a }: GalleryWork, { size: b }: GalleryWork): number {
  return a.width * a.height - b.width * b.height || a.width - b.width;
}

/** By the month the work was finished, the earlier first. */
export function compareWorkDates(a: GalleryWork, b: GalleryWork): number {
  return a.year - b.year || a.month - b.month;
}
