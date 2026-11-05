import { http, type Tagged } from "@/shared/api/http";
import type { ListPhoto, ListPhotoItem } from "@/shared/api/photo";

import { processPhotosResponseSchema } from "../model/processPhoto";

interface ReplaceProcessPhotosParams {
  /** The ETag of the list the new one was made from. */
  etag: string;
  /** In the order the site shows them; a saved photo left out is deleted. */
  processPhotos: readonly ListPhotoItem[];
}

/**
 * Replaces the whole list at once: the server saves all of it or nothing, and returns the saved
 * list. Rejected with 412 when the list has changed since `etag` was read, for example in another
 * tab, and with 422 when it names a photo or an upload that no longer exists.
 */
export async function replaceProcessPhotos({
  etag,
  processPhotos,
}: ReplaceProcessPhotosParams): Promise<Tagged<ListPhoto[]>> {
  const { data, etag: savedEtag } = await http.putIfMatch({
    path: "/about/process-photos",
    body: { processPhotos },
    etag,
    schema: processPhotosResponseSchema,
  });

  return { data: data.processPhotos, etag: savedEtag };
}
