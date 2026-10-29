import { FirebaseError } from "firebase/app";
import { describe, expect, it } from "vitest";

import { getLoginErrorMessage } from "@/features/login/lib/getLoginErrorMessage";
import { networkErrorMessage } from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";
import { NetworkError } from "@/shared/api/networkError";

const invalidCredentialsMessage = "Неверный логин или пароль";
const fallbackMessage = "Не удалось выполнить вход. Попробуйте ещё раз";

describe("getLoginErrorMessage", () => {
  it.each([
    "auth/invalid-credential",
    "auth/invalid-email",
    "auth/user-disabled",
    "auth/user-not-found",
    "auth/wrong-password",
  ])("does not tell which part was wrong for %s", (code) => {
    expect(getLoginErrorMessage(new FirebaseError(code, "Firebase"))).toBe(
      invalidCredentialsMessage,
    );
  });

  it.each([
    ["auth/too-many-requests", "Слишком много попыток входа. Попробуйте позже"],
    ["auth/network-request-failed", networkErrorMessage],
    ["auth/internal-error", fallbackMessage],
  ])("explains %s", (code, message) => {
    expect(getLoginErrorMessage(new FirebaseError(code, "Firebase"))).toBe(message);
  });

  it("treats an account that is not the admin as wrong credentials", () => {
    expect(getLoginErrorMessage(new HttpError(401))).toBe(invalidCredentialsMessage);
  });

  it.each([
    ["a server error", new HttpError(500), "Сервис временно недоступен. Попробуйте позже"],
    ["a lost connection", new NetworkError(new TypeError()), networkErrorMessage],
    ["another error", new HttpError(403), fallbackMessage],
  ])("explains %s of the API", (_name, error, message) => {
    expect(getLoginErrorMessage(error)).toBe(message);
  });
});
