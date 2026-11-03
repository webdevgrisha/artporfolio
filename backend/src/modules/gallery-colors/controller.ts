import type { RequestHandler } from "express";

import type { GalleryColors } from "#modules/gallery-colors/schema";
import { getGalleryColors, replaceGalleryColors } from "#modules/gallery-colors/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readColors: RequestHandler<object, GalleryColors> = async (_request, response) => {
  const { data, etag } = await getGalleryColors();

  response.status(200).set("ETag", etag).json(data);
};

export const replaceColors: RequestHandler<object, GalleryColors, GalleryColors> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceGalleryColors(request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json(data);
};
