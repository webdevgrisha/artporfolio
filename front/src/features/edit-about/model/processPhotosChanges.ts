import type { ProcessPhoto } from "@/entities/about";

import type { ProcessPhotoRow } from "./processPhotosFormSchema";

/** What a save does with one row of the process photos. */
export type ProcessPhotoStep =
  | { photo: ProcessPhoto; type: "keep" }
  | { alt: string; photo: ProcessPhoto; type: "updateAlt" }
  | { alt: string; file: File; photo: ProcessPhoto; type: "replace" }
  | { alt: string; file: File; type: "add" };

export interface ProcessPhotosChanges {
  /** Saved photos that are no longer in the list. */
  deletedIds: string[];
  /** One step per row, in the new order. */
  steps: ProcessPhotoStep[];
}

function toStep(row: ProcessPhotoRow): ProcessPhotoStep {
  if (row.status === "new") return { alt: row.alt, file: row.file, type: "add" };
  if (row.file) return { alt: row.alt, file: row.file, photo: row.photo, type: "replace" };
  if (row.alt !== row.photo.alt) return { alt: row.alt, photo: row.photo, type: "updateAlt" };

  return { photo: row.photo, type: "keep" };
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
  const keptIds = new Set(rows.flatMap((row) => (row.status === "saved" ? [row.photo.id] : [])));
  const deletedIds = saved.filter((photo) => !keptIds.has(photo.id)).map((photo) => photo.id);
  const steps = rows.map(toStep);

  // Every photo is kept as saved, in the same order.
  const isUnchanged =
    steps.length === saved.length &&
    steps.every((step, index) => step.type === "keep" && step.photo.id === saved[index]?.id);

  return isUnchanged ? undefined : { deletedIds, steps };
}
