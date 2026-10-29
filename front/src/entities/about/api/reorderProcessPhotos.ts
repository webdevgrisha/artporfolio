import { z } from "zod";

import { http } from "@/shared/api/http";

const processPhotoOrderSchema = z.object({
  ids: z.array(z.string()),
});

interface ReorderProcessPhotosParams {
  csrfToken: string;
  /** Every process photo id, once, in the new order. */
  ids: readonly string[];
}

/**
 * Puts the process photos in the given order and returns it. Rejected with 409 when the ids
 * differ from the photos on the server.
 */
export async function reorderProcessPhotos({
  csrfToken,
  ids,
}: ReorderProcessPhotosParams): Promise<string[]> {
  const response = await http.put({
    path: "/about/process-photos/order",
    body: { ids },
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: processPhotoOrderSchema,
  });

  return response.ids;
}
