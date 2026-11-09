import type { StoredCollection } from "#modules/gallery/collections/schema";
import { byTitle } from "#shared/text/titles";

/** The latest finished first, then the latest started; collections of the same years by title. */
export function compareCollections(a: StoredCollection, b: StoredCollection): number {
  return (
    (b.endYear ?? b.startYear) - (a.endYear ?? a.startYear) ||
    b.startYear - a.startYear ||
    byTitle(a, b)
  );
}
