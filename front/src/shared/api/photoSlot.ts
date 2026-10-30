import { queryOptions } from "@tanstack/react-query";

import type { SavePhotoParams } from "@/shared/lib/photoForm";

import { http, type Tagged } from "./http";
import { type Photo, photoResponseSchema, slotPhotoResponseSchema } from "./photo";
import { uploadImage } from "./upload";

/**
 * A single photo with its description at `path` of the API, such as «Моё фото» at `/about/photo`
 * (backend/src/modules/photo-slot), and the query that reads it with its ETag. A save puts the
 * saved photo into that query.
 */
export function photoSlot(path: string, queryKey: string[]) {
  return {
    path,
    query: queryOptions({
      queryFn: ({ signal }) => getSlotPhoto(path, signal),
      queryKey,
    }),
  };
}

export type PhotoSlot = ReturnType<typeof photoSlot>;

/** The photo, `null` until one is uploaded, with the ETag that a change of it sends back. */
async function getSlotPhoto(path: string, signal: AbortSignal): Promise<Tagged<Photo | null>> {
  const { data, etag } = await http.getWithETag({ path, schema: slotPhotoResponseSchema, signal });

  return { data: data.photo, etag };
}

/**
 * Sends a change of the photo made from the photo with the ETag `etag`; resolves with the photo
 * now saved and its new ETag, `null` after a deletion, and rejects when it was not saved.
 */
export async function saveSlotPhoto(
  { path }: PhotoSlot,
  { change, etag }: SavePhotoParams,
): Promise<Tagged<Photo | null>> {
  switch (change.type) {
    case "upload": {
      const uploadId = await uploadImage(change.file);
      const saved = await http.putIfMatch({
        path,
        body: { alt: change.alt, uploadId },
        etag,
        schema: photoResponseSchema,
      });

      return { data: saved.data.photo, etag: saved.etag };
    }
    case "updateAlt": {
      // Changes the description without uploading the photo again.
      const saved = await http.patchIfMatch({
        path,
        body: { alt: change.alt },
        etag,
        schema: photoResponseSchema,
      });

      return { data: saved.data.photo, etag: saved.etag };
    }
    case "delete":
      // Deletes the photo and its files; succeeds when there is no photo.
      return { data: null, etag: await http.deleteIfMatch({ path, etag }) };
  }
}
