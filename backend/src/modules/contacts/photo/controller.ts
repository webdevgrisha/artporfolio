import type { RequestHandler } from "express";

import {
  deleteContactPhoto,
  getContactPhoto,
  saveContactPhoto,
  updateContactPhotoAlt,
} from "#modules/contacts/photo/service";
import type {
  PhotoAltBody,
  PhotoBody,
  PhotoResponse,
  SlotPhotoResponse,
} from "#shared/images/photo";
import { ifMatchHeader } from "#shared/middleware/preconditions";

export const readPhoto: RequestHandler<object, SlotPhotoResponse> = async (_request, response) => {
  const { data, etag } = await getContactPhoto();

  response.status(200).set("ETag", etag).json({ photo: data });
};

export const putPhoto: RequestHandler<object, PhotoResponse, PhotoBody> = async (
  request,
  response,
) => {
  const { created, data, etag } = await saveContactPhoto(request.body, ifMatchHeader(request));

  response
    .status(created ? 201 : 200)
    .set("ETag", etag)
    .json({ photo: data });
};

export const updatePhotoAlt: RequestHandler<object, PhotoResponse, PhotoAltBody> = async (
  request,
  response,
) => {
  const { data, etag } = await updateContactPhotoAlt(request.body.alt, ifMatchHeader(request));

  response.status(200).set("ETag", etag).json({ photo: data });
};

export const deletePhoto: RequestHandler = async (request, response) => {
  await deleteContactPhoto(ifMatchHeader(request));

  response.status(204).end();
};
