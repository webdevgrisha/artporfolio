import { http } from "@/shared/api/http";
import { type Photo, photoResponseSchema } from "@/shared/api/photo";

interface ReplaceContactPhotoParams {
  alt: string;
  /** The new file, uploaded with `uploadImage`. */
  uploadId: string;
}

/** Sets or replaces the photo and returns it as stored by the server. */
export async function replaceContactPhoto({
  alt,
  uploadId,
}: ReplaceContactPhotoParams): Promise<Photo> {
  const response = await http.put({
    path: "/contacts/photo",
    body: { alt, uploadId },
    schema: photoResponseSchema,
  });

  return response.photo;
}
