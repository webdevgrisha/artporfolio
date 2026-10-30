import type { RequestHandler } from "express";

import {
  deleteAboutPhoto,
  saveAboutPhoto,
  updateAboutPhotoAlt,
} from "#modules/about/photo/service";
import type { PhotoAltBody, PhotoBody, PhotoResponse } from "#shared/images/photo";

export const putPhoto: RequestHandler<object, PhotoResponse, PhotoBody> = async (
  request,
  response,
) => {
  const { created, photo } = await saveAboutPhoto(request.body);

  response.status(created ? 201 : 200).json({ photo });
};

export const updatePhotoAlt: RequestHandler<object, PhotoResponse, PhotoAltBody> = async (
  request,
  response,
) => {
  const photo = await updateAboutPhotoAlt(request.body.alt);

  response.status(200).json({ photo });
};

export const deletePhoto: RequestHandler = async (_request, response) => {
  await deleteAboutPhoto();

  response.status(204).end();
};
