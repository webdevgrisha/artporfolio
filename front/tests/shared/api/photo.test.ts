import { describe, expect, it } from "vitest";

import { networkErrorMessage, sessionExpiredMessage } from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";
import { NetworkError } from "@/shared/api/networkError";
import { getSavePhotoErrorMessage } from "@/shared/api/photo";

describe("getSavePhotoErrorMessage", () => {
  it.each([
    [400, "Сервер не принял фото. Попробуйте другой файл"],
    [401, sessionExpiredMessage],
    [403, sessionExpiredMessage],
    [404, "Фото уже удалено. Обновите страницу"],
    [413, "Фото больше 15 МБ"],
    [409, "Не удалось сохранить фото. Попробуйте ещё раз"],
  ])("explains %d", (status, message) => {
    expect(getSavePhotoErrorMessage(new HttpError(status))).toBe(message);
  });

  it("falls back to the common messages", () => {
    expect(getSavePhotoErrorMessage(new NetworkError(new TypeError()))).toBe(networkErrorMessage);
  });
});
