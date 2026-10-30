import { getSaveErrorMessage } from "@/shared/api/requestErrorMessages";
import { getUploadErrorMessage, UploadError } from "@/shared/api/upload";

export function getSaveTextErrorMessage(error: unknown): string {
  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял тексты. Проверьте их и попробуйте ещё раз",
      // The texts were changed since this page loaded them, for example in another tab.
      412: "Тексты уже изменили в другой вкладке. Обновите страницу и внесите изменения заново",
    },
    fallback: "Не удалось сохранить тексты. Попробуйте ещё раз",
  });
}

export function getSaveProcessPhotosErrorMessage(error: unknown): string {
  if (error instanceof UploadError) return getUploadErrorMessage(error);

  return getSaveErrorMessage(error, {
    byStatus: {
      400: "Сервер не принял фото. Проверьте описания и попробуйте ещё раз",
      // The list was changed since this page loaded it, for example in another tab.
      412: "Фото уже изменили в другой вкладке. Обновите страницу и внесите изменения заново",
      422: "Фото на сервере изменились. Обновите страницу и внесите изменения заново",
    },
    fallback: "Не удалось сохранить фото. Попробуйте ещё раз",
  });
}
