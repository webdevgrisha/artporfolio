import { http, type Tagged } from "@/shared/api/http";
import { type Photo, slotPhotoResponseSchema } from "@/shared/api/photo";

interface GetContactPhotoParams {
  /** Cancels the request, e.g. when its query is cancelled. */
  signal?: AbortSignal;
}

/** The contacts photo, `null` until one is uploaded, with the ETag that a change of it sends back. */
export async function getContactPhoto({
  signal,
}: GetContactPhotoParams = {}): Promise<Tagged<Photo | null>> {
  const { data, etag } = await http.getWithETag({
    path: "/contacts/photo",
    schema: slotPhotoResponseSchema,
    signal,
  });

  return { data: data.photo, etag };
}
