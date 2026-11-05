import type { RequestHandler } from "express";

import type { GalleryMaterials } from "#modules/gallery/materials/schema";
import { getGalleryMaterials, replaceGalleryMaterials } from "#modules/gallery/materials/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readMaterials: RequestHandler<object, GalleryMaterials> = async (
  _request,
  response,
) => {
  const { data, etag } = await getGalleryMaterials();

  response.status(200).set("ETag", etag).json(data);
};

export const replaceMaterials: RequestHandler<object, GalleryMaterials, GalleryMaterials> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceGalleryMaterials(request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json(data);
};
