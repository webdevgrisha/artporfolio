import { HttpError } from "./httpError";
import { NetworkError } from "./networkError";

export const networkErrorMessage =
  "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз";
const unavailableErrorMessage = "Сервис временно недоступен. Попробуйте позже";

// Signing in on this page would lose the unsaved changes. A sign-in in another tab renews the
// session cookie for this one too, and a save asks for a fresh CSRF token anyway.
export const sessionExpiredMessage =
  "Сессия истекла. Войдите снова в новой вкладке и сохраните здесь ещё раз";

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

export interface SaveErrorMessages {
  /** For a rejection the API answers with this status, such as 400 for an invalid body. */
  byStatus?: Readonly<Partial<Record<number, string>>>;
  /** For any other failure; it names what was not saved. */
  fallback: string;
}

/**
 * The message for a failed change, such as a save or a deletion: an expired session first, then
 * the messages of the change for its statuses, then no connection or a server error.
 */
export function getSaveErrorMessage(error: unknown, messages: SaveErrorMessages): string {
  if (isSessionExpiredError(error)) return sessionExpiredMessage;

  const statusMessage = error instanceof HttpError ? messages.byStatus?.[error.status] : undefined;

  return statusMessage ?? getRequestErrorMessage(error, messages.fallback);
}
