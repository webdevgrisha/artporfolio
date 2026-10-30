import type { DocumentSnapshot } from "firebase-admin/firestore";

import { contactsDocument } from "#modules/contacts/document";
import type { Tagged } from "#shared/http/etag";
import {
  deletePhoto,
  getPhoto,
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

export function getContactPhoto(): Promise<Tagged<Photo | null>> {
  return getPhoto(contactPhoto);
}

export function saveContactPhoto(body: PhotoBody, ifMatch: string): Promise<SavedPhoto> {
  return savePhoto(contactPhoto, body, ifMatch);
}

export function updateContactPhotoAlt(alt: string, ifMatch: string): Promise<Tagged<Photo>> {
  return updatePhotoAlt(contactPhoto, alt, ifMatch);
}

export function deleteContactPhoto(ifMatch: string): Promise<string> {
  return deletePhoto(contactPhoto, ifMatch);
}
