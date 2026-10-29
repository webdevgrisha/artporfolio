import {
  getRequestErrorMessage,
  isSessionExpiredError,
  sessionExpiredMessage,
} from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";
import { imageUploadRules } from "@/shared/api/image";
import { formatFileSize } from "@/shared/lib/formatFileSize";

export function getSaveContactsErrorMessage(error: unknown): string {
  if (isSessionExpiredError(error)) return sessionExpiredMessage;
  if (error instanceof HttpError && error.status === 400) {
    return "Сервер не принял ссылки. Проверьте их и попробуйте ещё раз";
  }

  return getRequestErrorMessage(error, "Не удалось сохранить изменения. Попробуйте ещё раз");
}

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
