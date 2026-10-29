import { z } from "zod";

import { formatFileSize } from "@/shared/lib/formatFileSize";

import {
  getRequestErrorMessage,
  isSessionExpiredError,
  sessionExpiredMessage,
} from "./getRequestErrorMessage";
import { HttpError } from "./httpError";
import { imageSchema, imageUploadRules } from "./image";

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
  if (isSessionExpiredError(error)) return sessionExpiredMessage;
  if (error instanceof HttpError) {
    if (error.status === 400) return "Сервер не принял фото. Попробуйте другой файл";
    // Only an update of the alt text expects an existing photo.
    if (error.status === 404) return "Фото уже удалено. Обновите страницу";
    if (error.status === 413) return `Фото больше ${formatFileSize(imageUploadRules.maxFileSize)}`;
  }

  return getRequestErrorMessage(error, "Не удалось сохранить фото. Попробуйте ещё раз");
}
