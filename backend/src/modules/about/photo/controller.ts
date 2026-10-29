import type { RequestHandler } from "express";

import {
  deleteAboutPhoto,
  saveAboutPhoto,
  updateAboutPhotoAlt,
} from "#modules/about/photo/service";
import type { PhotoAltBody, PhotoResponse } from "#shared/images/photo";
import { uploadedFile } from "#shared/middleware/upload";

export const uploadPhoto: RequestHandler<object, PhotoResponse, PhotoAltBody> = async (
  request,
  response,
) => {
  const { created, photo } = await saveAboutPhoto(uploadedFile(request), request.body.alt);

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
