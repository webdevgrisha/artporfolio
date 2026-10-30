import { z } from "zod";

import { formatFileSize } from "@/shared/lib/formatFileSize";

import { imageSchema, imageUploadRules } from "./image";
import { getSaveErrorMessage } from "./requestErrorMessages";
import { requestErrorOf } from "./upload";

/**
 * A single photo with its description, such as «Моё фото» or the contacts photo
 * (backend/src/shared/images/photo.ts → PhotoSlot).
 */
export const photoSchema = imageSchema.extend({
  alt: z.string(),
});

export type Photo = z.infer<typeof photoSchema>;

/** The shape of every API response that returns a saved photo. */
export const photoResponseSchema = z.object({
  photo: photoSchema,
});

/** The photo of a slot as its `GET` returns it: `null` until one is uploaded. */
export const slotPhotoResponseSchema = z.object({
  photo: photoSchema.nullable(),
});

/** For a failed upload, alt text update or deletion of a photo. */
export function getSavePhotoErrorMessage(error: unknown): string {
  return getSaveErrorMessage(requestErrorOf(error), {
    byStatus: {
      400: "Сервер не принял фото. Попробуйте другой файл",
      // Only an update of the alt text expects an existing photo.
      404: "Фото уже удалено. Обновите страницу",
      // The photo was changed since this page loaded it, for example in another tab.
      412: "Фото уже изменили в другой вкладке",
      413: `Фото больше ${formatFileSize(imageUploadRules.maxFileSize)}`,
      // The upload is kept for a day; the photo is sent right after it, so this is rare.
      422: "Загрузка фото устарела. Выберите фото ещё раз",
    },
    fallback: "Не удалось сохранить фото. Попробуйте ещё раз",
  });
}
