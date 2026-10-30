import type { RequestHandler } from "express";

import type { AboutResponse } from "#modules/about/schema";
import { getAbout } from "#modules/about/service";

export const readAbout: RequestHandler<object, AboutResponse> = async (_request, response) => {
  response.status(200).json(await getAbout());
};
