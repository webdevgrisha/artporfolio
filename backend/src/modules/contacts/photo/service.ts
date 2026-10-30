import type { DocumentSnapshot } from "firebase-admin/firestore";

import { contactsDocument } from "#modules/contacts/document";
import {
  deletePhoto,
  type Photo,
  type PhotoBody,
  photoSlot,
  readPhoto,
  type SavedPhoto,
  type StoredPhoto,
  savePhoto,
  updatePhotoAlt,
} from "#shared/images/photo";

const contactPhoto = photoSlot({
  document: contactsDocument,
  field: "photo",
  folder: "contacts/photo",
});

export function readContactPhoto(snapshot: DocumentSnapshot): StoredPhoto | null {
  return readPhoto(contactPhoto, snapshot);
}

export function saveContactPhoto(body: PhotoBody): Promise<SavedPhoto> {
  return savePhoto(contactPhoto, body);
}

export function updateContactPhotoAlt(alt: string): Promise<Photo> {
  return updatePhotoAlt(contactPhoto, alt);
}

export function deleteContactPhoto(): Promise<void> {
  return deletePhoto(contactPhoto);
}
