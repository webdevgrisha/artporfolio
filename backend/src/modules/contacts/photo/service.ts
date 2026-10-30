import { contactsDocument } from "#modules/contacts/document";
import {
  deletePhoto,
  type Photo,
  type PhotoBody,
  type PhotoSlot,
  type SavedPhoto,
  savePhoto,
  updatePhotoAlt,
} from "#shared/images/photo";

const contactPhoto: PhotoSlot = {
  document: contactsDocument,
  field: "photo",
  folder: "contacts/photo",
};

export function saveContactPhoto(body: PhotoBody): Promise<SavedPhoto> {
  return savePhoto(contactPhoto, body);
}

export function updateContactPhotoAlt(alt: string): Promise<Photo> {
  return updatePhotoAlt(contactPhoto, alt);
}

export function deleteContactPhoto(): Promise<void> {
  return deletePhoto(contactPhoto);
}
