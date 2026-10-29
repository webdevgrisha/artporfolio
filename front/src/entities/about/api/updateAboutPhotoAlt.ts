import { http } from "@/shared/api/http";
import { type Photo, photoResponseSchema } from "@/shared/api/photo";

interface UpdateAboutPhotoAltParams {
  alt: string;
  csrfToken: string;
}

/** Changes the alt text without uploading the photo again. */
export async function updateAboutPhotoAlt({
  alt,
  csrfToken,
}: UpdateAboutPhotoAltParams): Promise<Photo> {
  const response = await http.patch({
    path: "/about/photo",
    body: { alt },
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: photoResponseSchema,
  });

  return response.photo;
}
