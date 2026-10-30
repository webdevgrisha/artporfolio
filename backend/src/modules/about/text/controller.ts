import type { RequestHandler } from "express";

import type { AboutText, AboutTextResponse } from "#modules/about/text/schema";
import { getAboutText, saveAboutText } from "#modules/about/text/service";

export const readText: RequestHandler<object, AboutTextResponse> = async (_request, response) => {
  response.status(200).json({ text: await getAboutText() });
};

export const replaceText: RequestHandler<object, AboutTextResponse, AboutText> = async (
  request,
  response,
) => {
  await saveAboutText(request.body);

  response.status(200).json({ text: request.body });
};
