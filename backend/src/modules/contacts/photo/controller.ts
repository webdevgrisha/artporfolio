import type { RequestHandler } from "express";

import type { PhotoAltBody } from "#modules/contacts/photo/schema";
import {
  deleteContactPhoto,
  saveContactPhoto,
  updateContactPhotoAlt,
} from "#modules/contacts/photo/service";
import { uploadedFile } from "#shared/middleware/upload";

export const uploadPhoto: RequestHandler<object, unknown, PhotoAltBody> = async (
  request,
  response,
) => {
  const { created, photo } = await saveContactPhoto(uploadedFile(request), request.body.alt);

  response.status(created ? 201 : 200).json({ photo });
};

export const updatePhotoAlt: RequestHandler<object, unknown, PhotoAltBody> = async (
  request,
  response,
) => {
  const photo = await updateContactPhotoAlt(request.body.alt);

  response.status(200).json({ photo });
};

export const deletePhoto: RequestHandler = async (_request, response) => {
  await deleteContactPhoto();

  response.status(204).end();
};
