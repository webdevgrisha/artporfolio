import { aboutDocument } from "#modules/about/document";
import {
  deletePhoto,
  type Photo,
  type PhotoSlot,
  type SavedPhoto,
  savePhoto,
  updatePhotoAlt,
} from "#shared/images/photo";
import type { UploadedFile } from "#shared/middleware/upload";

/** «My photo», the portrait next to the introduction. */
const aboutPhoto: PhotoSlot = {
  document: aboutDocument,
  field: "photo",
  folder: "about/photo",
};

export function saveAboutPhoto(file: UploadedFile, alt: string): Promise<SavedPhoto> {
  return savePhoto(aboutPhoto, file, alt);
}

export function updateAboutPhotoAlt(alt: string): Promise<Photo> {
  return updatePhotoAlt(aboutPhoto, alt);
}

export function deleteAboutPhoto(): Promise<void> {
  return deletePhoto(aboutPhoto);
}
