import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "./http";
import { type Photo, type PhotoBody, photoSchema } from "./photo";

interface SaveSlotPhotoParams {
  body: PhotoBody;
  /** The ETag of the photo the change was made from. */
  etag: string;
}

/**
 * A single photo with its description at `path` of the API, such as «Моё фото» at `/about/photo`
 * (backend/src/modules/photo-slot), and the query that reads it, `null` until one is uploaded,
 * with its ETag. A save puts the saved photo into that query.
 */
export function photoSlot(path: string, queryKey: string[]) {
  return {
    path,
    query: queryOptions({
      queryFn: (): Promise<Tagged<Photo | null>> =>
        http.getWithETag({ path, schema: photoSchema.nullable() }),
      queryKey,
    }),
  };
}

export type PhotoSlot = ReturnType<typeof photoSlot>;

/**
 * Replaces the photo made from the photo with the ETag `etag`; resolves with the photo now saved
 * and its new ETag. A photo is never deleted: it can only be replaced.
 */
export function saveSlotPhoto(
  { path }: PhotoSlot,
  { body, etag }: SaveSlotPhotoParams,
): Promise<Tagged<Photo>> {
  return http.putIfMatch({ path, body, etag, schema: photoSchema });
}
