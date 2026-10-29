import { contactsDocument } from "#modules/contacts/document";
import {
  deletePhoto,
  getPhoto,
  type Photo,
  type PhotoSlot,
  type SavedPhoto,
  savePhoto,
  updatePhotoAlt,
} from "#shared/images/photo";
import type { UploadedFile } from "#shared/middleware/upload";

const contactPhoto: PhotoSlot = {
  document: contactsDocument,
  field: "photo",
  folder: "contacts/photo",
};

export function getContactPhoto(): Promise<Photo | null> {
  return getPhoto(contactPhoto);
}

export function saveContactPhoto(file: UploadedFile, alt: string): Promise<SavedPhoto> {
  return savePhoto(contactPhoto, file, alt);
}

export function updateContactPhotoAlt(alt: string): Promise<Photo> {
  return updatePhotoAlt(contactPhoto, alt);
}

export function deleteContactPhoto(): Promise<void> {
  return deletePhoto(contactPhoto);
}
