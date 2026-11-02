import type { GallerySection } from "@/entities/gallery";

/** The search of the table, kept in the address, so going back to it brings the same rows. */
export const searchParam = "q";

/** Whether the title of the section or of one of its subsections contains the query, in any case. */
export function matchesSectionQuery(
  { subsections, title }: GallerySection,
  query: string,
): boolean {
  const needle = query.trim().toLocaleLowerCase("ru");

  return [title, ...subsections.map((subsection) => subsection.title)].some((text) =>
    text.toLocaleLowerCase("ru").includes(needle),
  );
}
