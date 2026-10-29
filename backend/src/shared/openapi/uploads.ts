import { z } from "zod";
import type { ZodOpenApiMediaTypeObject } from "zod-openapi";

import { photoAltBodySchema } from "#shared/images/photo";
import { maxSourceFileSize } from "#shared/images/processing";

/** The file field of an image upload, for the API description only: parseUpload reads it. */
export const imageFileSchema = z.file().max(maxSourceFileSize).meta({
  description:
    "A JPEG or PNG photo of up to 15 MB and 50 megapixels, with a file name of up to 255 characters. WebP and AVIF are rejected: they are already compressed for the web. The EXIF orientation is applied and all metadata, including the location, is removed. The original is kept privately to rebuild the images later.",
});

/** A multipart/form-data body with an image file and the given text fields. */
export function imageUploadContent(
  schema: z.ZodObject,
): Record<"multipart/form-data", ZodOpenApiMediaTypeObject> {
  return {
    "multipart/form-data": {
      schema,
      encoding: { file: { contentType: "image/jpeg, image/png" } },
    },
  };
}

/** The body of a photo upload: the image file and its alt text. */
export const photoUploadContent = imageUploadContent(
  photoAltBodySchema.extend({ file: imageFileSchema }),
);
