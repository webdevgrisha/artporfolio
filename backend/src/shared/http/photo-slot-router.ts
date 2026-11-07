import { type RequestHandler, Router } from "express";

import {
  getPhoto,
  type Photo,
  type PhotoBody,
  type PhotoSlot,
  photoBodySchema,
  savePhoto,
} from "#shared/images/photo";
import { requireContentType } from "#shared/middleware/content-type";
import { ifMatchHeader, requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

/**
 * The resource of one photo slot, such as «My photo» or the contact photo. The photo is public:
 * the site shows it to every visitor. A change applies only to the photo the client read: it sends
 * its ETag in If-Match. A photo can be replaced, never removed: the site does not show the page
 * without it.
 */
export function photoSlotRouter(slot: PhotoSlot): Router {
  const readPhoto: RequestHandler<object, Photo | null> = async (_request, response) => {
    const { data, etag } = await getPhoto(slot);

    response.status(200).set("ETag", etag).json(data);
  };

  const putPhoto: RequestHandler<object, Photo, PhotoBody> = async (request, response) => {
    const { created, data, etag } = await savePhoto(slot, request.body, ifMatchHeader(request));

    response
      .status(created ? 201 : 200)
      .set("ETag", etag)
      .json(data);
  };

  const router = Router();

  router.get("/", readPhoto);
  router.put(
    "/",
    requireContentType("application/json"),
    requireIfMatch,
    validateBody(photoBodySchema),
    putPhoto,
  );

  return router;
}
