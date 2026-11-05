import type { GalleryWorkSummary } from "@/entities/gallery";

/**
 * The works a collection may take: those on their own, and those of its own taken out in the form
 * and not saved yet. A work of another collection moves in its own form: the API refuses it here.
 */
export function addableWorks<TWork extends Pick<GalleryWorkSummary, "collectionId" | "id">>(
  works: readonly TWork[],
  chosenIds: readonly string[],
  collectionId: string | undefined,
): TWork[] {
  return works.filter(
    (work) =>
      !chosenIds.includes(work.id) &&
      (work.collectionId === null || work.collectionId === collectionId),
  );
}
