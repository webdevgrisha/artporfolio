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
  deleted: ProcessPhoto[];
  /** Whether the server needs the new order once the rows are saved. */
  isReordered: boolean;
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
  const savedIds = new Set(saved.map((photo) => photo.id));
  const keptIds = new Set(rows.flatMap((row) => (row.status === "saved" ? [row.photo.id] : [])));
  const deleted = saved.filter((photo) => !keptIds.has(photo.id));
  const steps = rows.map(toStep);

  // The server keeps its photos in their order and puts the added ones at the end; `undefined`
  // stands for an added photo, or one that `saved` does not have yet.
  const order = rows.map((row) =>
    row.status === "saved" && savedIds.has(row.photo.id) ? row.photo.id : undefined,
  );
  const serverOrder = [
    ...saved.flatMap((photo) => (keptIds.has(photo.id) ? [photo.id] : [])),
    ...order.filter((id) => id === undefined),
  ];
  const isReordered = order.some((id, index) => id !== serverOrder[index]);

  const isUnchanged =
    deleted.length === 0 && !isReordered && steps.every((step) => step.type === "keep");

  return isUnchanged ? undefined : { deleted, isReordered, steps };
}
