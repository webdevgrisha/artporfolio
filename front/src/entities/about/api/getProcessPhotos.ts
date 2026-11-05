import { http, type Tagged } from "@/shared/api/http";
import type { ListPhoto } from "@/shared/api/photo";

import { processPhotosResponseSchema } from "../model/processPhoto";

/** The process photos in their order, with the ETag that a replacement of the list sends back. */
export async function getProcessPhotos(): Promise<Tagged<ListPhoto[]>> {
  const { data, etag } = await http.getWithETag({
    path: "/about/process-photos",
    schema: processPhotosResponseSchema,
  });

  return { data: data.processPhotos, etag };
}
