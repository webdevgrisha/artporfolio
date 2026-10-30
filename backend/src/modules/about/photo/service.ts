import type { DocumentSnapshot } from "firebase-admin/firestore";

import { aboutDocument } from "#modules/about/document";
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

/** «My photo», the portrait next to the introduction. */
const aboutPhoto = photoSlot({
  document: aboutDocument,
  field: "photo",
  folder: "about/photo",
});

export function readAboutPhoto(snapshot: DocumentSnapshot): StoredPhoto | null {
  return readPhoto(aboutPhoto, snapshot);
}

export function getAboutPhoto(): Promise<Tagged<Photo | null>> {
  return getPhoto(aboutPhoto);
}

export function saveAboutPhoto(body: PhotoBody, ifMatch: string): Promise<SavedPhoto> {
  return savePhoto(aboutPhoto, body, ifMatch);
}

export function updateAboutPhotoAlt(alt: string, ifMatch: string): Promise<Tagged<Photo>> {
  return updatePhotoAlt(aboutPhoto, alt, ifMatch);
}

export function deleteAboutPhoto(ifMatch: string): Promise<string> {
  return deletePhoto(aboutPhoto, ifMatch);
}
