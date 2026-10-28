import { http } from "@/shared/api/http";

import { type ContactPhoto, contactPhotoResponseSchema } from "../model/contactPhoto";

interface UpdateContactPhotoAltParams {
  alt: string;
  csrfToken: string;
}

/** Changes the alt text without uploading the photo again. */
export async function updateContactPhotoAlt({
  alt,
  csrfToken,
}: UpdateContactPhotoAltParams): Promise<ContactPhoto> {
  const response = await http.patch({
    path: "/contacts/photo",
    body: { alt },
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: contactPhotoResponseSchema,
  });

  return response.photo;
}
