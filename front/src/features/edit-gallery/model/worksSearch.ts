import type { GalleryWork } from "@/entities/gallery";

/** The search of the table, kept in the address, so going back to it brings the same rows. */
export const worksSearchParam = "q";

/** Whether the title of the work contains the query, in any case. */
export function matchesWorkQuery({ title }: GalleryWork, query: string): boolean {
  return title.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"));
}
