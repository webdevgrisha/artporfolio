import { deleteAboutPhoto, replaceAboutPhoto, updateAboutPhotoAlt } from "@/entities/about";
import { uploadImage } from "@/shared/api/upload";
import type { PhotoChange } from "@/shared/lib/photoForm";

/** Sends a change of «Моё фото»; rejects when it was not saved. */
export async function saveAboutPhoto(change: PhotoChange): Promise<void> {
  switch (change.type) {
    case "upload":
      await replaceAboutPhoto({ alt: change.alt, uploadId: await uploadImage(change.file) });
      break;
    case "updateAlt":
      await updateAboutPhotoAlt({ alt: change.alt });
      break;
    case "delete":
      await deleteAboutPhoto();
      break;
  }
}
