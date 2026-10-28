import { HttpError } from "./httpError";

export const networkErrorMessage =
  "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз";
const unavailableErrorMessage = "Сервис временно недоступен. Попробуйте позже";

/**
 * The message for failures common to every request: no connection or a server error.
 * Callers handle their own cases first and pass the message for anything else.
 */
export function getRequestErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof HttpError && error.status >= 500) {
    return unavailableErrorMessage;
  }

  // fetch rejects with a TypeError when the request never reaches the server; so does a failed
  // lazy import of a page chunk.
  if (error instanceof TypeError) {
    return networkErrorMessage;
  }

  return fallbackMessage;
}
