import { describe, expect, it } from "vitest";

import {
  getSaveAboutErrorMessage,
  getSaveProcessPhotoErrorMessage,
  getSaveProcessPhotoOrderErrorMessage,
  getSaveTextErrorMessage,
} from "@/features/edit-about/lib/saveErrorMessages";
import { networkErrorMessage, sessionExpiredMessage } from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";
import { NetworkError } from "@/shared/api/networkError";

describe("getSaveAboutErrorMessage", () => {
  it.each([
    ["403", new HttpError(403), sessionExpiredMessage],
    ["a lost connection", new NetworkError(new TypeError()), networkErrorMessage],
    ["another error", new HttpError(400), "Не удалось сохранить изменения. Попробуйте ещё раз"],
  ])("explains %s", (_name, error, message) => {
    expect(getSaveAboutErrorMessage(error)).toBe(message);
  });
});

describe("getSaveTextErrorMessage", () => {
  it.each([
    ["400", new HttpError(400), "Сервер не принял тексты. Проверьте их и попробуйте ещё раз"],
    ["401", new HttpError(401), sessionExpiredMessage],
    ["another error", new HttpError(409), "Не удалось сохранить тексты. Попробуйте ещё раз"],
  ])("explains %s", (_name, error, message) => {
    expect(getSaveTextErrorMessage(error)).toBe(message);
  });
});

describe("getSaveProcessPhotoErrorMessage", () => {
  it.each([
    [400, "Сервер не принял фото «etude.jpg». Попробуйте другой файл"],
    [401, sessionExpiredMessage],
    [404, "Фото «etude.jpg» уже удалено. Обновите страницу"],
    [409, "Фото «etude.jpg» не добавлено: фото уже максимум"],
    [413, "Фото «etude.jpg» больше 15 МБ"],
    [422, "Не удалось сохранить фото «etude.jpg». Попробуйте ещё раз"],
  ])("explains %d, naming the file", (status, message) => {
    expect(getSaveProcessPhotoErrorMessage(new HttpError(status), "etude.jpg")).toBe(message);
  });
});

describe("getSaveProcessPhotoOrderErrorMessage", () => {
  it.each([
    [
      "409",
      new HttpError(409),
      "Порядок фото не сохранён: фото на сервере изменились. Обновите страницу",
    ],
    ["403", new HttpError(403), sessionExpiredMessage],
    ["another error", new HttpError(400), "Не удалось сохранить порядок фото. Попробуйте ещё раз"],
  ])("explains %s", (_name, error, message) => {
    expect(getSaveProcessPhotoOrderErrorMessage(error)).toBe(message);
  });
});
