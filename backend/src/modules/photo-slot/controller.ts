import type { RequestHandler } from "express";

import {
  getPhoto,
  type Photo,
  type PhotoAltBody,
  type PhotoBody,
  type PhotoSlot,
  savePhoto,
  updatePhotoAlt,
} from "#shared/images/photo";
import { ifMatchHeader } from "#shared/middleware/preconditions";

/** The handlers of one photo slot, such as «My photo» or the contact photo. */
export function photoSlotController(slot: PhotoSlot) {
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

  const patchAlt: RequestHandler<object, Photo, PhotoAltBody> = async (request, response) => {
    const { data, etag } = await updatePhotoAlt(slot, request.body.alt, ifMatchHeader(request));

    response.status(200).set("ETag", etag).json(data);
  };

  return { patchAlt, putPhoto, readPhoto };
}
