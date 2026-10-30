import { z } from "zod";

import type { Image } from "@/shared/api/image";

/** The value of an image field that keeps the image already on the server. */
export const savedImage = "saved";

/** The value of an image field: the saved image, a newly picked file, or `null` for no image. */
export const imageFieldValueSchema = z.union([z.literal(savedImage), z.instanceof(File), z.null()]);

export type ImageFieldValue = z.infer<typeof imageFieldValueSchema>;

/** The field value for an image on the server, or for none. */
export function toImageFieldValue(image: Image | null): ImageFieldValue {
  return image ? savedImage : null;
}
