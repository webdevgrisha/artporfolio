import { HttpError } from "./httpError";
import { NetworkError } from "./networkError";

export const networkErrorMessage =
  "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз";
const unavailableErrorMessage = "Сервис временно недоступен. Попробуйте позже";

export const sessionExpiredMessage = "Сессия истекла. Войдите снова, чтобы сохранить изменения";

/** A change was rejected because the admin session or its CSRF token is no longer valid. */
export function isSessionExpiredError(error: unknown): boolean {
  return error instanceof HttpError && (error.status === 401 || error.status === 403);
}

/**
 * The message for failures common to every request: no connection or a server error.
 * Callers handle their own cases first and pass the message for anything else.
 */
export function getRequestErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof HttpError && error.status >= 500) {
    return unavailableErrorMessage;
  }

  if (error instanceof NetworkError) {
    return networkErrorMessage;
  }

  return fallbackMessage;
}
