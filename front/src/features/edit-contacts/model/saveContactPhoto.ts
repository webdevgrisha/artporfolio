import { deleteContactPhoto, updateContactPhotoAlt, uploadContactPhoto } from "@/entities/contacts";
import type { PhotoChange } from "@/shared/lib/photoForm";

/** Sends a change of the contacts photo; rejects when it was not saved. */
export async function saveContactPhoto(change: PhotoChange): Promise<void> {
  switch (change.type) {
    case "upload":
      await uploadContactPhoto({ alt: change.alt, file: change.file });
      break;
    case "updateAlt":
      await updateContactPhotoAlt({ alt: change.alt });
      break;
    case "delete":
      await deleteContactPhoto();
      break;
  }
}
