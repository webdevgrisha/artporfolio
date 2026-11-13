import type { RequestHandler } from "express";

import type { AboutResponse } from "#modules/about/schema";
import { getAbout } from "#modules/about/service";
import type { LanguageQuery } from "#shared/i18n/language-query";

export const readAbout: RequestHandler<object, AboutResponse, unknown, LanguageQuery> = async (
  request,
  response,
) => {
  response.status(200).json(await getAbout(request.query.lang));
};
