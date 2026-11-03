import type { RequestHandler } from "express";

import type {
  HeroBody,
  HeroResponse,
  PageHeroResponse,
  PageParams,
  PagesResponse,
} from "#modules/pages/schema";
import { getPageHero, getPages, savePageHero } from "#modules/pages/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readPages: RequestHandler<object, PagesResponse> = async (_request, response) => {
  const pages = await getPages();

  response.status(200).json({ pages });
};

export const readHero: RequestHandler<PageParams, PageHeroResponse> = async (request, response) => {
  const { data, etag } = await getPageHero(request.params.page);

  response.status(200).set("ETag", etag).json({ hero: data });
};

export const putHero: RequestHandler<PageParams, HeroResponse, HeroBody> = async (
  request,
  response,
) => {
  const { created, data, etag } = await savePageHero(
    request.params.page,
    request.body.uploadId,
    ifMatchHeader(request),
  );

  response
    .status(created ? 201 : 200)
    .set("ETag", etag)
    .json({ hero: data });
};
