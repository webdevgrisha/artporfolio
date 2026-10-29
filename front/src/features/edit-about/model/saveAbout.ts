import {
  deleteAboutPhoto,
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

export interface SaveAboutResult {
  /** Why some part was not saved. */
  error?: string;
  /** Whether a change of the photo was saved. */
  photoSaved: boolean;
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
 * Saves the changed parts independently: texts that were saved stay saved even if the photo
 * fails, and the other way round. Failures are reported in `error`.
 */
export async function saveAbout({ photo, text }: AboutChanges): Promise<SaveAboutResult> {
  let csrfToken: string;

  try {
    csrfToken = await getCsrfToken();
  } catch (error) {
    return { error: getSaveAboutErrorMessage(error), photoSaved: false, textSaved: false };
  }

  const [textResult, photoResult] = await Promise.allSettled([
    text ? updateAboutText({ csrfToken, text }) : undefined,
    photo ? savePhoto(photo, csrfToken) : undefined,
  ]);
  const errors = new Set<string>();

  if (textResult.status === "rejected") {
    errors.add(getSaveTextErrorMessage(textResult.reason));
  }

  if (photoResult.status === "rejected") {
    errors.add(getSavePhotoErrorMessage(photoResult.reason));
  }

  return {
    // Both parts usually fail for the same reason, such as no connection: it is said once.
    error: errors.size > 0 ? [...errors].join(". ") : undefined,
    photoSaved: photo !== undefined && photoResult.status === "fulfilled",
    textSaved: text !== undefined && textResult.status === "fulfilled",
  };
}
