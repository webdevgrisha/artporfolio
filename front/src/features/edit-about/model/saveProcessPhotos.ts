import {
  addProcessPhoto,
  deleteProcessPhoto,
  type ProcessPhoto,
  reorderProcessPhotos,
  replaceProcessPhoto,
  updateProcessPhotoAlt,
} from "@/entities/about";

import type { ProcessPhotoStep, ProcessPhotosChanges } from "./processPhotosChanges";

type EditStep = Exclude<ProcessPhotoStep, { type: "keep" }>;

/** A request of a process photos save that failed; its `cause` is the request error. */
export class SaveProcessPhotoError extends Error {
  /** The file of the photo the request was for; `undefined` for the order. */
  readonly fileName: string | undefined;

  constructor(fileName: string | undefined, cause: unknown) {
    super("A process photo request failed", { cause });
    this.name = "SaveProcessPhotoError";
    this.fileName = fileName;
  }
}

function saveStep(step: EditStep): Promise<ProcessPhoto> {
  switch (step.type) {
    case "add":
      return addProcessPhoto({ alt: step.alt, file: step.file });
    case "replace":
      return replaceProcessPhoto({ alt: step.alt, file: step.file, id: step.photo.id });
    case "updateAlt":
      return updateProcessPhotoAlt({ alt: step.alt, id: step.photo.id });
  }
}

function getFileName(step: EditStep): string {
  return step.type === "updateAlt" ? step.photo.fileName : step.file.name;
}

async function send<T>(fileName: string | undefined, request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw new SaveProcessPhotoError(fileName, error);
  }
}

/**
 * Saves the process photos one request at a time and stops at the first that fails: the
 * deletions first, so that new photos fit under the limit; then the changed rows in order, one
 * upload at a time because the server encodes every photo; then the order, once the server has
 * every photo of the list. `onRowSaved` gets each saved row, so a repeated save does not send it
 * again.
 */
export async function saveProcessPhotos(
  { deleted, isReordered, steps }: ProcessPhotosChanges,
  onRowSaved: (index: number, photo: ProcessPhoto) => void,
): Promise<void> {
  for (const photo of deleted) {
    await send(photo.fileName, () => deleteProcessPhoto({ id: photo.id }));
  }

  const ids: string[] = [];

  for (const [index, step] of steps.entries()) {
    if (step.type === "keep") {
      ids.push(step.photo.id);
      continue;
    }

    const photo = await send(getFileName(step), () => saveStep(step));
    onRowSaved(index, photo);
    ids.push(photo.id);
  }

  if (isReordered) {
    await send(undefined, () => reorderProcessPhotos({ ids }));
  }
}
