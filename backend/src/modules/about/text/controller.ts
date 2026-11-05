import type { RequestHandler } from "express";

import type { AboutText } from "#modules/about/text/schema";
import { getAboutText, replaceAboutText } from "#modules/about/text/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readText: RequestHandler<object, AboutText> = async (_request, response) => {
  const { data, etag } = await getAboutText();

  response.status(200).set("ETag", etag).json(data);
};

export const replaceText: RequestHandler<object, AboutText, AboutText> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceAboutText(request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json(data);
};
