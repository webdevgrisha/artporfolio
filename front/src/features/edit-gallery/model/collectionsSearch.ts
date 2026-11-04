import type { GalleryCollection } from "@/entities/gallery";

/** The search of the table, kept in the address, so going back to it brings the same rows. */
export const collectionsSearchParam = "q";

/** Whether the title of the collection contains the query, in any case. */
export function matchesCollectionQuery({ title }: GalleryCollection, query: string): boolean {
  return title.toLocaleLowerCase("ru").includes(query.trim().toLocaleLowerCase("ru"));
}
