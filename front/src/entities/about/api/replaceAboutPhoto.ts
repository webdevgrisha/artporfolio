import { http } from "@/shared/api/http";
import { type Photo, photoResponseSchema } from "@/shared/api/photo";

interface ReplaceAboutPhotoParams {
  alt: string;
  /** The new file, uploaded with `uploadImage`. */
  uploadId: string;
}

/** Sets or replaces the photo and returns it as stored by the server. */
export async function replaceAboutPhoto({
  alt,
  uploadId,
}: ReplaceAboutPhotoParams): Promise<Photo> {
  const response = await http.put({
    path: "/about/photo",
    body: { alt, uploadId },
    schema: photoResponseSchema,
  });

  return response.photo;
}
