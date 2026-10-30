import type { ProcessPhoto } from "@/entities/about";

import type { ProcessPhotoRow } from "./processPhotosFormSchema";

/** What a save does with one row of the process photos. */
export type ProcessPhotoStep =
  | { id: string; type: "keep" }
  | { alt: string; id: string; type: "updateAlt" }
  | { alt: string; file: File; id: string; type: "replace" }
  | { alt: string; file: File; type: "add" };

export interface ProcessPhotosChanges {
  /** Saved photos that are no longer in the list. */
  deletedIds: string[];
  /** One step per row, in the new order. */
  steps: ProcessPhotoStep[];
}

function toStep(row: ProcessPhotoRow, saved: ReadonlyMap<string, ProcessPhoto>): ProcessPhotoStep {
  if (row.status === "new") return { alt: row.alt, file: row.file, type: "add" };
  if (row.file) return { alt: row.alt, file: row.file, id: row.photoId, type: "replace" };
  if (row.alt !== saved.get(row.photoId)?.alt) {
    return { alt: row.alt, id: row.photoId, type: "updateAlt" };
  }

  return { id: row.photoId, type: "keep" };
}

/**
 * Compares the rows with the photos on the server, by value: react-hook-form does not track
 * changes inside a File, and moving rows marks them all as changed. `undefined` when nothing
 * changed.
 */
export function getProcessPhotosChanges(
  rows: readonly ProcessPhotoRow[],
  saved: readonly ProcessPhoto[],
): ProcessPhotosChanges | undefined {
  const savedById = new Map(saved.map((photo) => [photo.id, photo]));
  const keptIds = new Set(rows.flatMap((row) => (row.status === "saved" ? [row.photoId] : [])));
  const deletedIds = saved.filter((photo) => !keptIds.has(photo.id)).map((photo) => photo.id);
  const steps = rows.map((row) => toStep(row, savedById));

  // Every photo is kept as saved, in the same order.
  const isUnchanged =
    steps.length === saved.length &&
    steps.every((step, index) => step.type === "keep" && step.id === saved[index]?.id);

  return isUnchanged ? undefined : { deletedIds, steps };
}
