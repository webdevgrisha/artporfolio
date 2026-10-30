import { http, type Tagged } from "@/shared/api/http";

interface DeleteContactPhotoParams {
  /** The ETag of the photo the deletion was decided on. */
  etag: string;
}

/**
 * Deletes the photo and its files; succeeds when there is no photo. Returns the empty photo with
 * its ETag, for the next change.
 */
export async function deleteContactPhoto({
  etag,
}: DeleteContactPhotoParams): Promise<Tagged<null>> {
  const emptyEtag = await http.deleteIfMatch({
    path: "/contacts/photo",
    etag,
  });

  return { data: null, etag: emptyEtag };
}
