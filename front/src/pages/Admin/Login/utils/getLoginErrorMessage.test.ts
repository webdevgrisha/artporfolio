import { FirebaseError } from "firebase/app";
import { describe, expect, it } from "vitest";

import { HttpError } from "@/http/httpError";
import { getLoginErrorMessage } from "@/pages/Admin/Login/utils/getLoginErrorMessage";

describe("getLoginErrorMessage", () => {
  it("uses the same message for a wrong password and a non-admin account", () => {
    const wrongPassword = getLoginErrorMessage(new FirebaseError("auth/invalid-credential", ""));
    const notAdmin = getLoginErrorMessage(new HttpError(401, "UNAUTHORIZED"));

    expect(wrongPassword).toBe("Неверный логин или пароль");
    expect(notAdmin).toBe(wrongPassword);
  });

  it("explains rate limiting", () => {
    expect(getLoginErrorMessage(new FirebaseError("auth/too-many-requests", ""))).toMatch(
      /Слишком много попыток/,
    );
  });

  it("reports network failures from Firebase and fetch", () => {
    const firebaseNetwork = getLoginErrorMessage(
      new FirebaseError("auth/network-request-failed", ""),
    );

    expect(firebaseNetwork).toMatch(/Нет соединения/);
    expect(getLoginErrorMessage(new TypeError("Failed to fetch"))).toBe(firebaseNetwork);
  });

  it("reports server errors as unavailable", () => {
    expect(getLoginErrorMessage(new HttpError(500))).toMatch(/временно недоступен/);
  });

  it("falls back to a generic message", () => {
    expect(getLoginErrorMessage(new HttpError(403, "FORBIDDEN"))).toBe(
      "Не удалось выполнить вход. Попробуйте ещё раз",
    );
    expect(getLoginErrorMessage(new Error("unknown"))).toBe(
      "Не удалось выполнить вход. Попробуйте ещё раз",
    );
  });
});
