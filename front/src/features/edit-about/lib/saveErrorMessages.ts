import {
  getRequestErrorMessage,
  isSessionExpiredError,
  sessionExpiredMessage,
} from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";
import { imageUploadRules } from "@/shared/api/image";
import { formatFileSize } from "@/shared/lib/formatFileSize";

/** For a failure before any part is sent, such as getting the CSRF token. */
export function getSaveAboutErrorMessage(error: unknown): string {
  if (isSessionExpiredError(error)) return sessionExpiredMessage;

  return getRequestErrorMessage(error, "Не удалось сохранить изменения. Попробуйте ещё раз");
}

export function getSaveTextErrorMessage(error: unknown): string {
  if (isSessionExpiredError(error)) return sessionExpiredMessage;
  if (error instanceof HttpError && error.status === 400) {
    return "Сервер не принял тексты. Проверьте их и попробуйте ещё раз";
  }

  return getRequestErrorMessage(error, "Не удалось сохранить тексты. Попробуйте ещё раз");
}

export function getSaveProcessPhotoErrorMessage(error: unknown, fileName: string): string {
  if (isSessionExpiredError(error)) return sessionExpiredMessage;
  if (error instanceof HttpError) {
    if (error.status === 400) return `Сервер не принял фото «${fileName}». Попробуйте другой файл`;
    if (error.status === 404) return `Фото «${fileName}» уже удалено. Обновите страницу`;
    // Only an upload of a new photo is rejected for a full list.
    if (error.status === 409) return `Фото «${fileName}» не добавлено: фото уже максимум`;
    if (error.status === 413) {
      return `Фото «${fileName}» больше ${formatFileSize(imageUploadRules.maxFileSize)}`;
    }
  }

  return getRequestErrorMessage(
    error,
    `Не удалось сохранить фото «${fileName}». Попробуйте ещё раз`,
  );
}

export function getSaveProcessPhotoOrderErrorMessage(error: unknown): string {
  if (isSessionExpiredError(error)) return sessionExpiredMessage;
  // The photos on the server differ from the ones on the page, e.g. after a save in another tab.
  if (error instanceof HttpError && error.status === 409) {
    return "Порядок фото не сохранён: фото на сервере изменились. Обновите страницу";
  }

  return getRequestErrorMessage(error, "Не удалось сохранить порядок фото. Попробуйте ещё раз");
}
