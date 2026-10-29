import {
  getRequestErrorMessage,
  isSessionExpiredError,
  sessionExpiredMessage,
} from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";
import { imageUploadRules } from "@/shared/api/image";
import { formatFileSize } from "@/shared/lib/formatFileSize";

/** For a save that could not start: the CSRF token was not received. */
export function getSavePageHeroesErrorMessage(error: unknown): string {
  return getRequestErrorMessage(error, "Не удалось сохранить изменения. Попробуйте ещё раз");
}

/** For the hero of one page, named by `pageLabel`. */
export function getSaveHeroErrorMessage(error: unknown, pageLabel: string): string {
  if (isSessionExpiredError(error)) return sessionExpiredMessage;
  if (error instanceof HttpError) {
    if (error.status === 400) {
      return `Сервер не принял фото страницы «${pageLabel}». Попробуйте другой файл`;
    }
    if (error.status === 413) {
      return `Фото страницы «${pageLabel}» больше ${formatFileSize(imageUploadRules.maxFileSize)}`;
    }
  }

  return getRequestErrorMessage(
    error,
    `Не удалось сохранить фото страницы «${pageLabel}». Попробуйте ещё раз`,
  );
}
