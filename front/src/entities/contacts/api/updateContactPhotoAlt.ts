import { http } from "@/shared/api/http";
import { type Photo, photoResponseSchema } from "@/shared/api/photo";

interface UpdateContactPhotoAltParams {
  alt: string;
  csrfToken: string;
}

/** Changes the alt text without uploading the photo again. */
export async function updateContactPhotoAlt({
  alt,
  csrfToken,
}: UpdateContactPhotoAltParams): Promise<Photo> {
  const response = await http.patch({
    path: "/contacts/photo",
    body: { alt },
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: photoResponseSchema,
  });

  return response.photo;
}
