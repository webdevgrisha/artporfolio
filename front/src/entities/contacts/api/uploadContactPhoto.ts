import { http } from "@/shared/api/http";

import { type ContactPhoto, contactPhotoResponseSchema } from "../model/contactPhoto";

interface UploadContactPhotoParams {
  alt: string;
  csrfToken: string;
  file: File;
}

/** Uploads or replaces the photo and returns it as stored by the server. */
export async function uploadContactPhoto({
  alt,
  csrfToken,
  file,
}: UploadContactPhotoParams): Promise<ContactPhoto> {
  const body = new FormData();
  body.set("alt", alt);
  body.set("file", file);

  const response = await http.put({
    path: "/contacts/photo",
    body,
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: contactPhotoResponseSchema,
  });

  return response.photo;
}
