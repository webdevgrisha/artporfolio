import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { getUploadErrorMessage, UploadError } from "@/shared/api/upload";

export function getSaveSlideshowErrorMessage(error: unknown): string {
  if (error instanceof UploadError) return getUploadErrorMessage(error);

  return getSaveErrorMessage(error, {
    byStatus: {
      422: "Фото на сервере изменились. Обновите страницу и внесите изменения заново",
    },
    fallback: "Не удалось сохранить фото. Попробуйте ещё раз",
  });
}
