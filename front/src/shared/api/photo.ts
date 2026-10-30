import { z } from "zod";

import { formatFileSize } from "@/shared/lib/formatFileSize";

import { imageSchema, imageUploadRules } from "./image";
import { getSaveErrorMessage } from "./requestErrorMessages";

/**
 * A single photo with its description, such as «Моё фото» or the contacts photo
 * (backend/src/shared/images/photo.ts → PhotoSlot).
 */
export const photoSchema = imageSchema.extend({
  alt: z.string(),
});

export type Photo = z.infer<typeof photoSchema>;

/** The shape of every API response that returns a photo. */
export const photoResponseSchema = z.object({
  photo: photoSchema,
});

/** For a failed upload, alt text update or deletion of a photo. */
export function getSavePhotoErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял фото. Попробуйте другой файл",
      // Only an update of the alt text expects an existing photo.
      404: "Фото уже удалено. Обновите страницу",
      413: `Фото больше ${formatFileSize(imageUploadRules.maxFileSize)}`,
    },
    fallback: "Не удалось сохранить фото. Попробуйте ещё раз",
  });
}
