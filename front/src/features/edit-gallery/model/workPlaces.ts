import { useQuery } from "@tanstack/react-query";

import { type GalleryWork, galleryWorksQuery } from "@/entities/gallery";

const collator = new Intl.Collator("ru", { sensitivity: "base" });

/** The places the works were made in, each once and alphabetically, so a place is typed alike. */
export function placesOf(works: readonly GalleryWork[]): string[] {
  const places = new Set(works.map(({ place }) => place).filter((place) => place !== ""));

  return [...places].sort(collator.compare);
}

/**
 * The places to suggest in a work form. They load beside the form and never hold it back: until
 * the works arrive, or if they fail to, there is nothing to suggest.
 */
export function useWorkPlaces(): string[] {
  const { data: works = [] } = useQuery(galleryWorksQuery);

  return placesOf(works);
}
