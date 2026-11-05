import type { RequestHandler } from "express";

import type { ProjectsIntro } from "#modules/projects/intro/schema";
import { getProjectsIntro, replaceProjectsIntro } from "#modules/projects/intro/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readIntro: RequestHandler<object, ProjectsIntro> = async (_request, response) => {
  const { data, etag } = await getProjectsIntro();

  response.status(200).set("ETag", etag).json(data);
};

export const replaceIntro: RequestHandler<object, ProjectsIntro, ProjectsIntro> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceProjectsIntro(request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json(data);
};
