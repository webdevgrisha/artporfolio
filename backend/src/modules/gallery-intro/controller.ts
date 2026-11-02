import type { RequestHandler } from "express";

import type { GalleryIntro, GalleryIntroResponse } from "#modules/gallery-intro/schema";
import { getGalleryIntro, replaceGalleryIntro } from "#modules/gallery-intro/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readIntro: RequestHandler<object, GalleryIntroResponse> = async (
  _request,
  response,
) => {
  const { data, etag } = await getGalleryIntro();

  response.status(200).set("ETag", etag).json({ intro: data });
};

export const replaceIntro: RequestHandler<object, GalleryIntroResponse, GalleryIntro> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceGalleryIntro(request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json({ intro: data });
};
