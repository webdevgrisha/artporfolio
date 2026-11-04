import type { GallerySection } from "@/entities/gallery";

/**
 * The columns the table sorts by, as named in the address. The sections stand by title already, so
 * only the number of subsections gives another order.
 */
export const sectionsSortableColumns = ["subsections"] as const;

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
