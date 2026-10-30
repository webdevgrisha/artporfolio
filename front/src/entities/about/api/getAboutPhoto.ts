import { http, type Tagged } from "@/shared/api/http";
import { type Photo, slotPhotoResponseSchema } from "@/shared/api/photo";

interface GetAboutPhotoParams {
  /** Cancels the request, e.g. when its query is cancelled. */
  signal: AbortSignal;
}

/** «Моё фото», `null` until one is uploaded, with the ETag that a change of it sends back. */
export async function getAboutPhoto({
  signal,
}: GetAboutPhotoParams): Promise<Tagged<Photo | null>> {
  const { data, etag } = await http.getWithETag({
    path: "/about/photo",
    schema: slotPhotoResponseSchema,
    signal,
  });

  return { data: data.photo, etag };
}
