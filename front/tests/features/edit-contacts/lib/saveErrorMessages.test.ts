import { describe, expect, it } from "vitest";

import { getSaveContactsErrorMessage } from "@/features/edit-contacts/lib/saveErrorMessages";
import { networkErrorMessage, sessionExpiredMessage } from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";
import { NetworkError } from "@/shared/api/networkError";

describe("getSaveContactsErrorMessage", () => {
  it.each([
    ["400", new HttpError(400), "Сервер не принял ссылки. Проверьте их и попробуйте ещё раз"],
    ["401", new HttpError(401), sessionExpiredMessage],
    ["403", new HttpError(403), sessionExpiredMessage],
    ["a lost connection", new NetworkError(new TypeError()), networkErrorMessage],
    ["another error", new HttpError(409), "Не удалось сохранить изменения. Попробуйте ещё раз"],
  ])("explains %s", (_name, error, message) => {
    expect(getSaveContactsErrorMessage(error)).toBe(message);
  });
});
