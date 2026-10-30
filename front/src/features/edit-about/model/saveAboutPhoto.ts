import { deleteAboutPhoto, updateAboutPhotoAlt, uploadAboutPhoto } from "@/entities/about";
import { getCsrfToken } from "@/shared/api/csrf";
import type { PhotoChange } from "@/shared/lib/photoForm";

/** Sends a change of «Моё фото»; rejects when it was not saved. */
export async function saveAboutPhoto(change: PhotoChange): Promise<void> {
  const csrfToken = await getCsrfToken();

  switch (change.type) {
    case "upload":
      await uploadAboutPhoto({ alt: change.alt, csrfToken, file: change.file });
      break;
    case "updateAlt":
      await updateAboutPhotoAlt({ alt: change.alt, csrfToken });
      break;
    case "delete":
      await deleteAboutPhoto({ csrfToken });
      break;
  }
}
