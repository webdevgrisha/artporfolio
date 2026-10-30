import { deleteAboutPhoto, updateAboutPhotoAlt, uploadAboutPhoto } from "@/entities/about";
import type { PhotoChange } from "@/shared/lib/photoForm";

/** Sends a change of «Моё фото»; rejects when it was not saved. */
export async function saveAboutPhoto(change: PhotoChange): Promise<void> {
  switch (change.type) {
    case "upload":
      await uploadAboutPhoto({ alt: change.alt, file: change.file });
      break;
    case "updateAlt":
      await updateAboutPhotoAlt({ alt: change.alt });
      break;
    case "delete":
      await deleteAboutPhoto();
      break;
  }
}
