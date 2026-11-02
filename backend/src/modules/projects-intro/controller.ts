import type { RequestHandler } from "express";

import type { ProjectsIntro, ProjectsIntroResponse } from "#modules/projects-intro/schema";
import { getProjectsIntro, replaceProjectsIntro } from "#modules/projects-intro/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readIntro: RequestHandler<object, ProjectsIntroResponse> = async (
  _request,
  response,
) => {
  const { data, etag } = await getProjectsIntro();

  response.status(200).set("ETag", etag).json({ intro: data });
};

export const replaceIntro: RequestHandler<object, ProjectsIntroResponse, ProjectsIntro> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceProjectsIntro(request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json({ intro: data });
};
