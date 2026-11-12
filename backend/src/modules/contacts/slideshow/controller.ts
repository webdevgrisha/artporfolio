import type { RequestHandler } from "express";

import type { Slideshow, SlideshowBody } from "#modules/contacts/slideshow/schema";
import { getSlideshow, replaceSlideshow } from "#modules/contacts/slideshow/service";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readSlideshow: RequestHandler<object, Slideshow> = async (_request, response) => {
  const { data, etag } = await getSlideshow();

  response.status(200).set("ETag", etag).json(data);
};

export const changeSlideshow: RequestHandler<object, Slideshow, SlideshowBody> = async (
  request,
  response,
) => {
  const { data, etag } = await replaceSlideshow(request.body, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json(data);
};
