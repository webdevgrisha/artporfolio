import { http, type Tagged } from "@/shared/api/http";
import { type Photo, photoResponseSchema } from "@/shared/api/photo";

interface ReplaceContactPhotoParams {
  alt: string;
  /** The ETag of the photo the change was made from. */
  etag: string;
  /** The new file, uploaded with `uploadImage`. */
  uploadId: string;
}

/** Sets or replaces the photo and returns it as stored by the server, with its new ETag. */
export async function replaceContactPhoto({
  alt,
  etag,
  uploadId,
}: ReplaceContactPhotoParams): Promise<Tagged<Photo>> {
  const { data, etag: savedEtag } = await http.putIfMatch({
    path: "/contacts/photo",
    body: { alt, uploadId },
    etag,
    schema: photoResponseSchema,
  });

  return { data: data.photo, etag: savedEtag };
}
