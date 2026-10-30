import type { RequestHandler } from "express";

import {
  deletePhoto,
  getPhoto,
  type PhotoAltBody,
  type PhotoBody,
  type PhotoResponse,
  type PhotoSlot,
  type SlotPhotoResponse,
  savePhoto,
  updatePhotoAlt,
} from "#shared/images/photo";
import { ifMatchHeader } from "#shared/middleware/preconditions";

/** The handlers of one photo slot, such as «My photo» or the contact photo. */
export function photoSlotController(slot: PhotoSlot) {
  const readPhoto: RequestHandler<object, SlotPhotoResponse> = async (_request, response) => {
    const { data, etag } = await getPhoto(slot);

    response.status(200).set("ETag", etag).json({ photo: data });
  };

  const putPhoto: RequestHandler<object, PhotoResponse, PhotoBody> = async (request, response) => {
    const { created, data, etag } = await savePhoto(slot, request.body, ifMatchHeader(request));

    response
      .status(created ? 201 : 200)
      .set("ETag", etag)
      .json({ photo: data });
  };

  const patchAlt: RequestHandler<object, PhotoResponse, PhotoAltBody> = async (
    request,
    response,
  ) => {
    const { data, etag } = await updatePhotoAlt(slot, request.body.alt, ifMatchHeader(request));

    response.status(200).set("ETag", etag).json({ photo: data });
  };

  const removePhoto: RequestHandler = async (request, response) => {
    const etag = await deletePhoto(slot, ifMatchHeader(request));

    // No content, but the tag of the empty photo: the next change sends it in If-Match.
    response.status(204).set("ETag", etag).end();
  };

  return { patchAlt, putPhoto, readPhoto, removePhoto };
}
