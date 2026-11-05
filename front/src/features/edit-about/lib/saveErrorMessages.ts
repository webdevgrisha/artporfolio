import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { getUploadErrorMessage, UploadError } from "@/shared/api/upload";

export function getSaveTextErrorMessage(error: unknown): string | null {
  return getSaveErrorMessage(error, {
    fallback: "Не удалось сохранить тексты. Попробуйте ещё раз",
  });
}

export function getSaveProcessPhotosErrorMessage(error: unknown): string | null {
  if (error instanceof UploadError) return getUploadErrorMessage(error);

  return getSaveErrorMessage(error, {
    byStatus: {
      422: "Фото на сервере изменились. Обновите страницу и внесите изменения заново",
    },
    fallback: "Не удалось сохранить фото. Попробуйте ещё раз",
  });
}
