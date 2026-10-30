import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { deletePhoto, putPhoto, updatePhotoAlt } from "#modules/contacts/photo/controller";
import { photoAltBodySchema, photoBodySchema } from "#shared/images/photo";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { validateBody } from "#shared/middleware/validation";

export const photoRouter = Router();

photoRouter.use(requireAuth, requireCsrfToken);

photoRouter.put(
  "/",
  requireContentType("application/json"),
  validateBody(photoBodySchema),
  putPhoto,
);
photoRouter.patch(
  "/",
  requireContentType("application/json"),
  validateBody(photoAltBodySchema),
  updatePhotoAlt,
);
photoRouter.delete("/", deletePhoto);
