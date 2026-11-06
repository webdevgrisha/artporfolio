import { z } from "zod";

import type { Photo, PhotoBody } from "@/shared/api/photo";
import { uploadImage } from "@/shared/api/upload";

import { type ImageFieldValue, imageFieldValueSchema, toImageFieldValue } from "./imageFieldValue";

// Mirrors the server rule in backend/src/shared/images/photo.ts.
export const maxAltLength = 250;

/** The description of a photo: what is on it, for screen readers and search engines. */
export const photoAltSchema = z
  .string()
  .trim()
  .min(1, "Опишите, что на фото")
  .max(maxAltLength, `Не длиннее ${String(maxAltLength)} символов`);

/**
 * The fields of a photo with its description, to spread into a form schema together with
 * `refinePhoto`. `PhotoFields` shows them.
 */
export const photoFieldsShape = {
  photo: imageFieldValueSchema,
  photoAlt: z.string().trim(),
};

export interface PhotoFormValues {
  photo: ImageFieldValue;
  photoAlt: string;
}

/**
 * Requires a photo: it can be replaced, not removed, since the site does not show the page without
 * it. The description is checked once there is a photo: until then it is hidden.
 */
export function refinePhoto<TValues extends PhotoFormValues>(
  { photo, photoAlt }: TValues,
  context: z.RefinementCtx<TValues>,
): void {
  if (photo === null) {
    context.addIssue({ code: "custom", message: "Выберите фото", path: ["photo"] });
    return;
  }

  for (const issue of photoAltSchema.safeParse(photoAlt).error?.issues ?? []) {
    context.addIssue({ code: "custom", message: issue.message, path: ["photoAlt"] });
  }
}

export function toPhotoFormValues(photo: Photo | null): PhotoFormValues {
  return { photo: toImageFieldValue(photo), photoAlt: photo?.alt ?? "" };
}

/**
 * The photo fields as the server takes them: uploads a newly picked file; a saved photo keeps its
 * file and sends its description alone. Rejects with `UploadError`.
 */
export async function toPhotoBody({ photo, photoAlt }: PhotoFormValues): Promise<PhotoBody> {
  return photo instanceof File
    ? { alt: photoAlt, uploadId: await uploadImage(photo) }
    : { alt: photoAlt };
}
