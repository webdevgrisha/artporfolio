import { http } from "@/shared/api/http";
import { type Photo, photoResponseSchema } from "@/shared/api/photo";

interface UploadContactPhotoParams {
  alt: string;
  file: File;
}

/** Uploads or replaces the photo and returns it as stored by the server. */
export async function uploadContactPhoto({ alt, file }: UploadContactPhotoParams): Promise<Photo> {
  const body = new FormData();
  body.set("alt", alt);
  body.set("file", file);

  const response = await http.put({
    path: "/contacts/photo",
    body,
    schema: photoResponseSchema,
  });

  return response.photo;
}
