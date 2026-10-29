import {
  deleteContactPhoto,
  updateContactPhotoAlt,
  updateContacts,
  uploadContactPhoto,
} from "@/entities/contacts";
import { getCsrfToken } from "@/shared/api/csrf";
import { getSavePhotoErrorMessage } from "@/shared/api/photo";
import { joinMessages } from "@/shared/lib/joinMessages";
import type { PhotoChange } from "@/shared/lib/photoForm";

import { getSaveContactsErrorMessage } from "../lib/saveErrorMessages";
import type { ContactsChanges } from "./contactsChanges";

export interface SaveContactsResult {
  /** Why some part was not saved. */
  error?: string;
  /** Whether changed links were saved. */
  linksSaved: boolean;
  /** Whether a change of the photo was saved. */
  photoSaved: boolean;
}

async function savePhoto(change: PhotoChange, csrfToken: string): Promise<void> {
  switch (change.type) {
    case "upload":
      await uploadContactPhoto({ alt: change.alt, csrfToken, file: change.file });
      break;
    case "updateAlt":
      await updateContactPhotoAlt({ alt: change.alt, csrfToken });
      break;
    case "delete":
      await deleteContactPhoto({ csrfToken });
      break;
  }
}

/**
 * Saves the changed parts independently: links that were saved stay saved even if the photo
 * fails, and the other way round. Failures are reported in `error`.
 */
export async function saveContacts({
  contacts,
  photo,
}: ContactsChanges): Promise<SaveContactsResult> {
  let csrfToken: string;

  try {
    csrfToken = await getCsrfToken();
  } catch (error) {
    return { error: getSaveContactsErrorMessage(error), linksSaved: false, photoSaved: false };
  }

  const [linksResult, photoResult] = await Promise.allSettled([
    contacts ? updateContacts({ contacts, csrfToken }) : undefined,
    photo ? savePhoto(photo, csrfToken) : undefined,
  ]);
  const errors = new Set<string>();

  if (linksResult.status === "rejected") {
    errors.add(getSaveContactsErrorMessage(linksResult.reason));
  }

  if (photoResult.status === "rejected") {
    errors.add(getSavePhotoErrorMessage(photoResult.reason));
  }

  return {
    // Both parts usually fail for the same reason, such as no connection: it is said once.
    error: joinMessages(errors),
    linksSaved: contacts !== undefined && linksResult.status === "fulfilled",
    photoSaved: photo !== undefined && photoResult.status === "fulfilled",
  };
}
