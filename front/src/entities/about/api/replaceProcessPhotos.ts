import { http, type Tagged } from "@/shared/api/http";

import { type ProcessPhoto, processPhotosResponseSchema } from "../model/processPhoto";

/**
 * One photo of the new list: a saved one by its id, a new file by its upload (see `uploadImage`),
 * or both to replace the file of a saved photo.
 */
export type ProcessPhotoItem =
  | { alt: string; id: string; uploadId?: string }
  | { alt: string; uploadId: string };

interface ReplaceProcessPhotosParams {
  /** The ETag of the list the new one was made from. */
  etag: string;
  /** In the order the site shows them; a saved photo left out is deleted. */
  processPhotos: readonly ProcessPhotoItem[];
}

/**
 * Replaces the whole list at once: the server saves all of it or nothing, and returns the saved
 * list. Rejected with 412 when the list has changed since `etag` was read, for example in another
 * tab, and with 422 when it names a photo or an upload that no longer exists.
 */
export async function replaceProcessPhotos({
  etag,
  processPhotos,
}: ReplaceProcessPhotosParams): Promise<Tagged<ProcessPhoto[]>> {
  const { data, etag: savedEtag } = await http.putIfMatch({
    path: "/about/process-photos",
    body: { processPhotos },
    etag,
    schema: processPhotosResponseSchema,
  });

  return { data: data.processPhotos, etag: savedEtag };
}
