import { FirebaseError } from "firebase/app";

import { HttpError } from "@/http/httpError";

const invalidCredentialsMessage = "Неверный логин или пароль";
const tooManyRequestsMessage = "Слишком много попыток входа. Попробуйте позже";
const networkMessage = "Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз";
const unavailableMessage = "Сервис временно недоступен. Попробуйте позже";
const fallbackMessage = "Не удалось выполнить вход. Попробуйте ещё раз";

export function getLoginErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/invalid-email":
      case "auth/user-disabled":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return invalidCredentialsMessage;
      case "auth/too-many-requests":
        return tooManyRequestsMessage;
      case "auth/network-request-failed":
        return networkMessage;
      default:
        return fallbackMessage;
    }
  }

  if (error instanceof HttpError) {
    if (error.status === 401) {
      // The account exists in Firebase but is not the configured admin, or the sign-in is stale.
      return invalidCredentialsMessage;
    }

    return error.status >= 500 ? unavailableMessage : fallbackMessage;
  }

  // fetch rejects with a TypeError when the request never reaches the server.
  if (error instanceof TypeError) {
    return networkMessage;
  }

  return fallbackMessage;
}
