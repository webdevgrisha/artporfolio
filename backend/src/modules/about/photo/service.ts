import type { DocumentSnapshot } from "firebase-admin/firestore";

import { aboutDocument } from "#modules/about/document";
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

/** «My photo», the portrait next to the introduction. */
const aboutPhoto = photoSlot({
  document: aboutDocument,
  field: "photo",
  folder: "about/photo",
});

export function readAboutPhoto(snapshot: DocumentSnapshot): StoredPhoto | null {
  return readPhoto(aboutPhoto, snapshot);
}

export function saveAboutPhoto(body: PhotoBody): Promise<SavedPhoto> {
  return savePhoto(aboutPhoto, body);
}

export function updateAboutPhotoAlt(alt: string): Promise<Photo> {
  return updatePhotoAlt(aboutPhoto, alt);
}

export function deleteAboutPhoto(): Promise<void> {
  return deletePhoto(aboutPhoto);
}
