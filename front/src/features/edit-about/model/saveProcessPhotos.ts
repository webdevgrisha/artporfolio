import {
  addProcessPhoto,
  deleteProcessPhoto,
  type ProcessPhoto,
  reorderProcessPhotos,
  replaceProcessPhoto,
  updateProcessPhotoAlt,
} from "@/entities/about";
import { isSessionExpiredError } from "@/shared/api/getRequestErrorMessage";
import { joinMessages } from "@/shared/lib/joinMessages";

import {
  getSaveProcessPhotoErrorMessage,
  getSaveProcessPhotoOrderErrorMessage,
} from "../lib/saveErrorMessages";
import { toProcessPhotoRow } from "./processPhotoRows";
import type { ProcessPhotoStep, ProcessPhotosChanges } from "./processPhotosChanges";
import type { ProcessPhotoRow } from "./processPhotosFormSchema";

type EditStep = Exclude<ProcessPhotoStep, { type: "keep" }>;

export interface SaveProcessPhotosResult {
  /** Why some change was not saved. */
  error?: string;
  /** The photos on the server after the save, in their order there. */
  photos: ProcessPhoto[];
  /** The rows after the save, in the form's order. A row whose change failed keeps it. */
  rows: ProcessPhotoRow[];
}

/** The row a step was made from: a step that was not saved keeps its change this way. */
function toUnsavedRow(step: EditStep): ProcessPhotoRow {
  switch (step.type) {
    case "add":
      return { alt: step.alt, file: step.file, status: "new" };
    case "replace":
      return { alt: step.alt, file: step.file, photoId: step.id, status: "saved" };
    case "updateAlt":
      return { alt: step.alt, file: null, photoId: step.id, status: "saved" };
  }
}

async function saveStep(step: EditStep, csrfToken: string): Promise<ProcessPhoto> {
  switch (step.type) {
    case "add":
      return addProcessPhoto({ alt: step.alt, csrfToken, file: step.file });
    case "replace":
      return replaceProcessPhoto({ alt: step.alt, csrfToken, file: step.file, id: step.id });
    case "updateAlt":
      return updateProcessPhotoAlt({ alt: step.alt, csrfToken, id: step.id });
  }
}

/**
 * Saves the process photos one request at a time: the deletions first, so that new photos fit
 * under the limit; then the rows in order, one upload at a time because the server encodes every
 * photo; then the order, once the server has every photo of the list. The rows are independent:
 * a failed one keeps its change and does not stop the others, except for an expired session.
 */
export async function saveProcessPhotos(
  { deletedIds, steps }: ProcessPhotosChanges,
  saved: readonly ProcessPhoto[],
  csrfToken: string,
): Promise<SaveProcessPhotosResult> {
  const savedById = new Map(saved.map((photo) => [photo.id, photo]));
  // Follows every saved change, so it is the list on the server at the end.
  let serverPhotos = [...saved];
  const errors = new Set<string>();
  let isStopped = false;

  function addError(error: unknown, message: string) {
    errors.add(message);
    // Without a session every other request is rejected too.
    if (isSessionExpiredError(error)) isStopped = true;
  }

  for (const id of deletedIds) {
    if (isStopped) break;

    try {
      await deleteProcessPhoto({ csrfToken, id });
      serverPhotos = serverPhotos.filter((photo) => photo.id !== id);
    } catch (error) {
      addError(error, getSaveProcessPhotoErrorMessage(error, savedById.get(id)?.fileName ?? ""));
    }
  }

  const rows: ProcessPhotoRow[] = [];

  for (const step of steps) {
    if (step.type === "keep") {
      const photo = savedById.get(step.id);
      if (photo) rows.push(toProcessPhotoRow(photo));
      continue;
    }

    if (isStopped) {
      rows.push(toUnsavedRow(step));
      continue;
    }

    try {
      const photo = await saveStep(step, csrfToken);
      serverPhotos =
        step.type === "add"
          ? [...serverPhotos, photo]
          : serverPhotos.map((serverPhoto) => (serverPhoto.id === photo.id ? photo : serverPhoto));
      rows.push(toProcessPhotoRow(photo));
    } catch (error) {
      const fileName = "file" in step ? step.file.name : (savedById.get(step.id)?.fileName ?? "");
      addError(error, getSaveProcessPhotoErrorMessage(error, fileName));
      rows.push(toUnsavedRow(step));
    }
  }

  // The order names every photo on the server once: a new photo that was not uploaded is left
  // out, and a photo that was not deleted makes the order impossible.
  const ids = rows.flatMap((row) => (row.status === "saved" ? [row.photoId] : []));
  const isEveryPhotoListed = serverPhotos.length === ids.length;
  const isReordered = ids.some((id, index) => id !== serverPhotos[index]?.id);

  if (!isStopped && isEveryPhotoListed && isReordered) {
    try {
      const order = await reorderProcessPhotos({ csrfToken, ids });
      const serverPhotosById = new Map(serverPhotos.map((photo) => [photo.id, photo]));
      serverPhotos = order.flatMap((id) => serverPhotosById.get(id) ?? []);
    } catch (error) {
      addError(error, getSaveProcessPhotoOrderErrorMessage(error));
    }
  }

  return {
    // Photos usually fail for the same reason, such as no connection: it is said once.
    error: joinMessages(errors),
    photos: serverPhotos,
    rows,
  };
}
