import type { RequestHandler } from "express";

import {
  deleteAboutPhoto,
  getAboutPhoto,
  saveAboutPhoto,
  updateAboutPhotoAlt,
} from "#modules/about/photo/service";
import type {
  PhotoAltBody,
  PhotoBody,
  PhotoResponse,
  SlotPhotoResponse,
} from "#shared/images/photo";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readPhoto: RequestHandler<object, SlotPhotoResponse> = async (_request, response) => {
  const { data, etag } = await getAboutPhoto();

  response.status(200).set("ETag", etag).json({ photo: data });
};

export const putPhoto: RequestHandler<object, PhotoResponse, PhotoBody> = async (
  request,
  response,
) => {
  const { created, data, etag } = await saveAboutPhoto(request.body, ifMatchHeader(request));

  response
    .status(created ? 201 : 200)
    .set("ETag", etag)
    .json({ photo: data });
};

export const updatePhotoAlt: RequestHandler<object, PhotoResponse, PhotoAltBody> = async (
  request,
  response,
) => {
  const { data, etag } = await updateAboutPhotoAlt(request.body.alt, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json({ photo: data });
};

export const deletePhoto: RequestHandler = async (request, response) => {
  const etag = await deleteAboutPhoto(ifMatchHeader(request));

  // No content, but the tag of the empty photo: the next change sends it in If-Match.
  response.status(204).set("ETag", etag).end();
};
