import { http, type Tagged } from "@/shared/api/http";

import { type ProcessPhoto, processPhotosResponseSchema } from "../model/processPhoto";

interface GetProcessPhotosParams {
  /** Cancels the request, e.g. when its query is cancelled. */
  signal: AbortSignal;
}

/** The process photos in their order, with the ETag that a replacement of the list sends back. */
export async function getProcessPhotos({
  signal,
}: GetProcessPhotosParams): Promise<Tagged<ProcessPhoto[]>> {
  const { data, etag } = await http.getWithETag({
    path: "/about/process-photos",
    schema: processPhotosResponseSchema,
    signal,
  });

  return { data: data.processPhotos, etag };
}
