import type { RequestHandler } from "express";

import type { ProjectsIntro } from "#modules/projects/intro/schema";
import { getProjectsIntro } from "#modules/projects/intro/service";
import type { LanguageQuery } from "#shared/i18n/language-query";

export const readProjectsIntro: RequestHandler<
  object,
  ProjectsIntro,
  unknown,
  LanguageQuery
> = async (request, response) => {
  const { data, etag } = await getProjectsIntro(request.query.lang);

  response.status(200).set("ETag", etag).json(data);
};
