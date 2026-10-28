import {
  type ContactPhoto,
  type Contacts,
  deleteContactPhoto,
  updateContactPhotoAlt,
  updateContacts,
  uploadContactPhoto,
} from "@/entities/contacts";
import { getCsrfToken } from "@/shared/api/csrf";

import { getSaveContactsErrorMessage, getSavePhotoErrorMessage } from "../lib/saveErrorMessages";
import type { ContactsChanges, PhotoChange } from "./contactsChanges";

/** What was saved. A part that failed or was not changed is left out. */
export interface SaveContactsResult {
  contacts?: Contacts;
  /** Why some part was not saved. */
  error?: string;
  /** `null` once the photo is deleted. */
  photo?: ContactPhoto | null;
}

async function savePhoto(change: PhotoChange, csrfToken: string): Promise<ContactPhoto | null> {
  switch (change.type) {
    case "upload":
      return uploadContactPhoto({ alt: change.alt, csrfToken, file: change.file });
    case "updateAlt":
      return updateContactPhotoAlt({ alt: change.alt, csrfToken });
    case "delete":
      await deleteContactPhoto({ csrfToken });
      return null;
  }
}

/**
 * Saves the changed parts independently: links that were saved stay saved even if the photo
 * fails, and the other way round.
 */
export async function saveContacts({
  contacts,
  photo,
}: ContactsChanges): Promise<SaveContactsResult> {
  const csrfToken = await getCsrfToken();
  const [contactsResult, photoResult] = await Promise.allSettled([
    contacts ? updateContacts({ contacts, csrfToken }) : undefined,
    photo ? savePhoto(photo, csrfToken) : undefined,
  ]);
  const errors = new Set<string>();
  const result: SaveContactsResult = {};

  if (contactsResult.status === "fulfilled") {
    result.contacts = contactsResult.value;
  } else {
    errors.add(getSaveContactsErrorMessage(contactsResult.reason));
  }

  if (photoResult.status === "fulfilled") {
    result.photo = photoResult.value;
  } else {
    errors.add(getSavePhotoErrorMessage(photoResult.reason));
  }

  // Both parts usually fail for the same reason, such as no connection: it is said once.
  if (errors.size > 0) {
    result.error = [...errors].join(". ");
  }

  return result;
}
