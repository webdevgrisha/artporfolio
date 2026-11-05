import { queryOptions } from "@tanstack/react-query";

import type { SavePhotoParams } from "@/shared/lib/photoForm";

import { http, type Tagged } from "./http";
import { type Photo, photoSchema } from "./photo";
import { uploadImage } from "./upload";

/**
 * A single photo with its description at `path` of the API, such as «Моё фото» at `/about/photo`
 * (backend/src/modules/photo-slot), and the query that reads it, `null` until one is uploaded,
 * with its ETag. A save puts the saved photo into that query.
 */
export function photoSlot(path: string, queryKey: string[]) {
  return {
    path,
    query: queryOptions({
      queryFn: ({ signal }): Promise<Tagged<Photo | null>> =>
        http.getWithETag({ path, schema: photoSchema.nullable(), signal }),
      queryKey,
    }),
  };
}

export type PhotoSlot = ReturnType<typeof photoSlot>;

/**
 * Sends a change of the photo made from the photo with the ETag `etag`; resolves with the photo
 * now saved and its new ETag, and rejects when it was not saved. A photo is never deleted: it can
 * only be replaced.
 */
export async function saveSlotPhoto(
  { path }: PhotoSlot,
  { change, etag }: SavePhotoParams,
): Promise<Tagged<Photo>> {
  switch (change.type) {
    case "upload": {
      const uploadId = await uploadImage(change.file);
      return http.putIfMatch({
        path,
        body: { alt: change.alt, uploadId },
        etag,
        schema: photoSchema,
      });
    }
    case "updateAlt": {
      // Changes the description without uploading the photo again.
      return http.patchIfMatch({
        path,
        body: { alt: change.alt },
        etag,
        schema: photoSchema,
      });
    }
  }
}
