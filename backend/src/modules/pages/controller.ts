import type { RequestHandler } from "express";

import type { HeroBody, HeroResponse, PageParams, PagesResponse } from "#modules/pages/schema";
import { deletePageHero, getPages, savePageHero } from "#modules/pages/service";

export const readPages: RequestHandler<object, PagesResponse> = async (_request, response) => {
  const pages = await getPages();

  response.status(200).json({ pages });
};

export const putHero: RequestHandler<PageParams, HeroResponse, HeroBody> = async (
  request,
  response,
) => {
  const { created, hero } = await savePageHero(request.params.page, request.body.uploadId);

  response.status(created ? 201 : 200).json({ hero });
};

export const deleteHero: RequestHandler<PageParams> = async (request, response) => {
  await deletePageHero(request.params.page);

  response.status(204).end();
};
