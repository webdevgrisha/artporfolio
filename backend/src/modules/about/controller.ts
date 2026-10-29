import type { RequestHandler } from "express";

import type { AboutResponse, AboutText, AboutTextResponse } from "#modules/about/schema";
import { getAbout, saveAboutText } from "#modules/about/service";

export const readAbout: RequestHandler<object, AboutResponse> = async (_request, response) => {
  response.status(200).json(await getAbout());
};

export const updateAboutText: RequestHandler<object, AboutTextResponse, AboutText> = async (
  request,
  response,
) => {
  await saveAboutText(request.body);

  response.status(200).json({ text: request.body });
};
