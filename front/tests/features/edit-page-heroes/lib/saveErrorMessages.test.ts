import { describe, expect, it } from "vitest";

import {
  getSaveHeroErrorMessage,
  getSavePageHeroesErrorMessage,
} from "@/features/edit-page-heroes/lib/saveErrorMessages";
import { networkErrorMessage, sessionExpiredMessage } from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";
import { NetworkError } from "@/shared/api/networkError";

describe("getSavePageHeroesErrorMessage", () => {
  it.each([
    ["a lost connection", new NetworkError(new TypeError()), networkErrorMessage],
    ["another error", new HttpError(403), "Не удалось сохранить изменения. Попробуйте ещё раз"],
  ])("explains %s", (_name, error, message) => {
    expect(getSavePageHeroesErrorMessage(error)).toBe(message);
  });
});

describe("getSaveHeroErrorMessage", () => {
  it.each([
    [400, "Сервер не принял фото страницы «Главная». Попробуйте другой файл"],
    [401, sessionExpiredMessage],
    [413, "Фото страницы «Главная» больше 15 МБ"],
    [404, "Не удалось сохранить фото страницы «Главная». Попробуйте ещё раз"],
  ])("explains %d, naming the page", (status, message) => {
    expect(getSaveHeroErrorMessage(new HttpError(status), "Главная")).toBe(message);
  });
});
