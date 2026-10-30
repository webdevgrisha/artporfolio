import { http, type Tagged } from "@/shared/api/http";
import { type Photo, photoResponseSchema } from "@/shared/api/photo";

interface UpdateContactPhotoAltParams {
  alt: string;
  /** The ETag of the photo the change was made from. */
  etag: string;
}

/** Changes the alt text without uploading the photo again; returns the photo with its new ETag. */
export async function updateContactPhotoAlt({
  alt,
  etag,
}: UpdateContactPhotoAltParams): Promise<Tagged<Photo>> {
  const { data, etag: savedEtag } = await http.patchIfMatch({
    path: "/contacts/photo",
    body: { alt },
    etag,
    schema: photoResponseSchema,
  });

  return { data: data.photo, etag: savedEtag };
}
