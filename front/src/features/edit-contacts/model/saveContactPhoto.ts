import {
  deleteContactPhoto,
  replaceContactPhoto,
  updateContactPhotoAlt,
} from "@/entities/contacts";
import type { Tagged } from "@/shared/api/http";
import type { Photo } from "@/shared/api/photo";
import { uploadImage } from "@/shared/api/upload";
import type { SavePhotoParams } from "@/shared/lib/photoForm";

/**
 * Sends a change of the contacts photo made from the photo with the ETag `etag`; resolves with the photo now
 * saved and its ETag, and rejects when it was not saved.
 */
export async function saveContactPhoto({
  change,
  etag,
}: SavePhotoParams): Promise<Tagged<Photo | null>> {
  switch (change.type) {
    case "upload":
      return replaceContactPhoto({
        alt: change.alt,
        etag,
        uploadId: await uploadImage(change.file),
      });
    case "updateAlt":
      return updateContactPhotoAlt({ alt: change.alt, etag });
    case "delete":
      return deleteContactPhoto({ etag });
  }
}
