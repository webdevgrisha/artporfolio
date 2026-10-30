import { aboutDocument } from "#modules/about/document";
import {
  deletePhoto,
  type Photo,
  type PhotoBody,
  type PhotoSlot,
  type SavedPhoto,
  savePhoto,
  updatePhotoAlt,
} from "#shared/images/photo";

/** «My photo», the portrait next to the introduction. */
const aboutPhoto: PhotoSlot = {
  document: aboutDocument,
  field: "photo",
  folder: "about/photo",
};

export function saveAboutPhoto(body: PhotoBody): Promise<SavedPhoto> {
  return savePhoto(aboutPhoto, body);
}

export function updateAboutPhotoAlt(alt: string): Promise<Photo> {
  return updatePhotoAlt(aboutPhoto, alt);
}

export function deleteAboutPhoto(): Promise<void> {
  return deletePhoto(aboutPhoto);
}
