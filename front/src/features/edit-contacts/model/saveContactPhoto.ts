import { deleteContactPhoto, updateContactPhotoAlt, uploadContactPhoto } from "@/entities/contacts";
import { getCsrfToken } from "@/shared/api/csrf";
import type { PhotoChange } from "@/shared/lib/photoForm";

/** Sends a change of the contacts photo; rejects when it was not saved. */
export async function saveContactPhoto(change: PhotoChange): Promise<void> {
  const csrfToken = await getCsrfToken();

  switch (change.type) {
    case "upload":
      await uploadContactPhoto({ alt: change.alt, csrfToken, file: change.file });
      break;
    case "updateAlt":
      await updateContactPhotoAlt({ alt: change.alt, csrfToken });
      break;
    case "delete":
      await deleteContactPhoto({ csrfToken });
      break;
  }
}
