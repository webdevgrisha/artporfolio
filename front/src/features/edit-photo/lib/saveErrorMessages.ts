import { imageUploadRules } from "@/shared/api/image";
import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { requestErrorOf } from "@/shared/api/upload";
import { formatFileSize } from "@/shared/lib/formatFileSize";

/** For a failed upload or update of a photo. */
export function getSavePhotoErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(requestErrorOf(error), {
    byStatus: {
      400: "Сервер не принял фото. Попробуйте другой файл",
      413: `Фото больше ${formatFileSize(imageUploadRules.maxFileSize)}`,
      // The upload is kept for a day; the photo is sent right after it, so this is rare.
      422: "Загрузка фото устарела. Выберите фото ещё раз",
    },
    fallback: "Не удалось сохранить фото. Попробуйте ещё раз",
  });
}
