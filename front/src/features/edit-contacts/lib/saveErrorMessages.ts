import {
  getRequestErrorMessage,
  isSessionExpiredError,
  sessionExpiredMessage,
} from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";

export function getSaveContactsErrorMessage(error: unknown): string {
  if (isSessionExpiredError(error)) return sessionExpiredMessage;
  if (error instanceof HttpError && error.status === 400) {
    return "Сервер не принял ссылки. Проверьте их и попробуйте ещё раз";
  }

  return getRequestErrorMessage(error, "Не удалось сохранить изменения. Попробуйте ещё раз");
}
