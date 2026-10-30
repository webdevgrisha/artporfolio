import { http, type Tagged } from "@/shared/api/http";

interface DeleteAboutPhotoParams {
  /** The ETag of the photo the deletion was decided on. */
  etag: string;
}

/**
 * Deletes the photo and its files; succeeds when there is no photo. Returns the empty photo with
 * its ETag, for the next change.
 */
export async function deleteAboutPhoto({ etag }: DeleteAboutPhotoParams): Promise<Tagged<null>> {
  const emptyEtag = await http.deleteIfMatch({
    path: "/about/photo",
    etag,
  });

  return { data: null, etag: emptyEtag };
}
