import { http } from "@/shared/api/http";

import { type AboutPhoto, aboutPhotoResponseSchema } from "../model/aboutPhoto";

interface UpdateAboutPhotoAltParams {
  alt: string;
  csrfToken: string;
}

/** Changes the alt text without uploading the photo again. */
export async function updateAboutPhotoAlt({
  alt,
  csrfToken,
}: UpdateAboutPhotoAltParams): Promise<AboutPhoto> {
  const response = await http.patch({
    path: "/about/photo",
    body: { alt },
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: aboutPhotoResponseSchema,
  });

  return response.photo;
}
