import { FirebaseError } from "firebase/app";

import { getRequestErrorMessage, networkErrorMessage } from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";

const invalidCredentialsMessage = "Неверный логин или пароль";
const tooManyRequestsMessage = "Слишком много попыток входа. Попробуйте позже";
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
        return networkErrorMessage;
      default:
        return fallbackMessage;
    }
  }

  // The account exists in Firebase but is not the configured admin, or the sign-in is stale.
  if (error instanceof HttpError && error.status === 401) {
    return invalidCredentialsMessage;
  }

  return getRequestErrorMessage(error, fallbackMessage);
}
