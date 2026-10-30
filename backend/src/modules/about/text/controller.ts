import type { RequestHandler } from "express";

import type { AboutText, AboutTextResponse } from "#modules/about/text/schema";
import { getAboutText, replaceAboutText } from "#modules/about/text/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readText: RequestHandler<object, AboutTextResponse> = async (_request, response) => {
  const { data, etag } = await getAboutText();

  response.status(200).set("ETag", etag).json({ text: data });
};

export const replaceText: RequestHandler<object, AboutTextResponse, AboutText> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceAboutText(request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json({ text: data });
};
