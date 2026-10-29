import { http } from "@/shared/api/http";
import { type Photo, photoResponseSchema } from "@/shared/api/photo";

interface UploadAboutPhotoParams {
  alt: string;
  csrfToken: string;
  file: File;
}

/** Uploads or replaces the photo and returns it as stored by the server. */
export async function uploadAboutPhoto({
  alt,
  csrfToken,
  file,
}: UploadAboutPhotoParams): Promise<Photo> {
  const body = new FormData();
  body.set("alt", alt);
  body.set("file", file);

  const response = await http.put({
    path: "/about/photo",
    body,
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: photoResponseSchema,
  });

  return response.photo;
}
