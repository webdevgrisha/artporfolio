import { http } from "@/shared/api/http";

import { type ProcessPhotoList, processPhotosResponseSchema } from "../model/processPhoto";

interface GetProcessPhotosParams {
  /** Cancels the request, e.g. when its query is cancelled. */
  signal: AbortSignal;
}

export async function getProcessPhotos({
  signal,
}: GetProcessPhotosParams): Promise<ProcessPhotoList> {
  const { data, etag } = await http.getWithETag({
    path: "/about/process-photos",
    schema: processPhotosResponseSchema,
    signal,
  });

  return { etag, processPhotos: data.processPhotos };
}
