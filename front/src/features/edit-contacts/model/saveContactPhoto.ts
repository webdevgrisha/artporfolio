import {
  deleteContactPhoto,
  replaceContactPhoto,
  updateContactPhotoAlt,
} from "@/entities/contacts";
import { uploadImage } from "@/shared/api/upload";
import type { PhotoChange } from "@/shared/lib/photoForm";

/** Sends a change of the contacts photo; rejects when it was not saved. */
export async function saveContactPhoto(change: PhotoChange): Promise<void> {
  switch (change.type) {
    case "upload":
      await replaceContactPhoto({ alt: change.alt, uploadId: await uploadImage(change.file) });
      break;
    case "updateAlt":
      await updateContactPhotoAlt({ alt: change.alt });
      break;
    case "delete":
      await deleteContactPhoto();
      break;
  }
}
