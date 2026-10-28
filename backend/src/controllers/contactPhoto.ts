import type { RequestHandler } from "express";

import { uploadedFile } from "#middleware/upload";
import type { PhotoAltBody } from "#schemas/contactPhoto";
import {
  deleteContactPhoto,
  saveContactPhoto,
  updateContactPhotoAlt,
} from "#services/contactPhoto";

export const uploadPhoto: RequestHandler<object, unknown, PhotoAltBody> = async (
  request,
  response,
) => {
  const photo = await saveContactPhoto(uploadedFile(request), request.body.alt);

  response.status(200).json({ photo });
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
