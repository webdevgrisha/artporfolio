import { HttpError } from "@/shared/api/httpError";

const invalidMessage = "Сервер не принял данные. Проверьте ссылки и попробуйте ещё раз";
const sessionMessage = "Сессия истекла. Войдите снова, чтобы сохранить изменения";
const networkMessage = "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз";
const unavailableMessage = "Сервис временно недоступен. Попробуйте позже";
const fallbackMessage = "Не удалось сохранить изменения. Попробуйте ещё раз";

export function getSaveContactsErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 400) return invalidMessage;
    if (error.status === 401 || error.status === 403) return sessionMessage;

    return error.status >= 500 ? unavailableMessage : fallbackMessage;
  }

  // fetch rejects with a TypeError when the request never reaches the server.
  if (error instanceof TypeError) {
    return networkMessage;
  }

  return fallbackMessage;
}
