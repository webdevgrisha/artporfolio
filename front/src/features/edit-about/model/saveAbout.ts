import {
  deleteAboutPhoto,
  type ProcessPhoto,
  updateAboutPhotoAlt,
  updateAboutText,
  uploadAboutPhoto,
} from "@/entities/about";
import { getCsrfToken } from "@/shared/api/csrf";

import {
  getSaveAboutErrorMessage,
  getSavePhotoErrorMessage,
  getSaveTextErrorMessage,
} from "../lib/saveErrorMessages";
import type { AboutChanges, PhotoChange } from "./aboutChanges";
import { type SaveProcessPhotosResult, saveProcessPhotos } from "./saveProcessPhotos";

export interface SaveAboutResult {
  /** Why some part was not saved. */
  error?: string;
  /** Whether a change of the photo was saved. */
  photoSaved: boolean;
  /** What became of the process photos, when they were changed. */
  processPhotos?: SaveProcessPhotosResult;
  /** Whether changed texts were saved. */
  textSaved: boolean;
}

async function savePhoto(change: PhotoChange, csrfToken: string): Promise<void> {
  switch (change.type) {
    case "upload":
      await uploadAboutPhoto({ alt: change.alt, csrfToken, file: change.file });
      break;
    case "updateAlt":
      await updateAboutPhotoAlt({ alt: change.alt, csrfToken });
      break;
    case "delete":
      await deleteAboutPhoto({ csrfToken });
      break;
  }
}

/**
 * Saves the changed parts independently: the texts, «Моё фото» and the process photos are sent at
 * the same time, and a part that was saved stays saved even if another one fails. Failures are
 * reported in `error`.
 */
export async function saveAbout(
  { photo, processPhotos, text }: AboutChanges,
  savedProcessPhotos: readonly ProcessPhoto[],
): Promise<SaveAboutResult> {
  let csrfToken: string;

  try {
    csrfToken = await getCsrfToken();
  } catch (error) {
    return { error: getSaveAboutErrorMessage(error), photoSaved: false, textSaved: false };
  }

  const [textResult, photoResult, processPhotosResult] = await Promise.allSettled([
    text ? updateAboutText({ csrfToken, text }) : undefined,
    photo ? savePhoto(photo, csrfToken) : undefined,
    // Reports the failure of each photo in its result.
    processPhotos ? saveProcessPhotos(processPhotos, savedProcessPhotos, csrfToken) : undefined,
  ]);
  const errors = new Set<string>();

  if (textResult.status === "rejected") {
    errors.add(getSaveTextErrorMessage(textResult.reason));
  }

  if (photoResult.status === "rejected") {
    errors.add(getSavePhotoErrorMessage(photoResult.reason));
  }

  if (processPhotosResult.status === "fulfilled" && processPhotosResult.value?.error) {
    errors.add(processPhotosResult.value.error);
  } else if (processPhotosResult.status === "rejected") {
    errors.add(getSaveAboutErrorMessage(processPhotosResult.reason));
  }

  return {
    // The parts usually fail for the same reason, such as no connection: it is said once.
    error: errors.size > 0 ? [...errors].join(". ") : undefined,
    photoSaved: photo !== undefined && photoResult.status === "fulfilled",
    processPhotos:
      processPhotosResult.status === "fulfilled" ? processPhotosResult.value : undefined,
    textSaved: text !== undefined && textResult.status === "fulfilled",
  };
}
