import type { RequestHandler } from "express";

import type { GalleryPalettes } from "#modules/gallery-palettes/schema";
import { getGalleryPalettes, replaceGalleryPalettes } from "#modules/gallery-palettes/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readPalettes: RequestHandler<object, GalleryPalettes> = async (_request, response) => {
  const { data, etag } = await getGalleryPalettes();

  response.status(200).set("ETag", etag).json(data);
};

export const replacePalettes: RequestHandler<object, GalleryPalettes, GalleryPalettes> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceGalleryPalettes(request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json(data);
};
