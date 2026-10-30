import { Router } from "express";

import { deletePhoto, putPhoto, updatePhotoAlt } from "#modules/about/photo/controller";
import { requireAuth } from "#modules/auth/middleware";
import { photoAltBodySchema, photoBodySchema } from "#shared/images/photo";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { validateBody } from "#shared/middleware/validation";

export const aboutPhotoRouter = Router();

aboutPhotoRouter.use(requireAuth, requireCsrfToken);

aboutPhotoRouter.put(
  "/",
  requireContentType("application/json"),
  validateBody(photoBodySchema),
  putPhoto,
);
aboutPhotoRouter.patch(
  "/",
  requireContentType("application/json"),
  validateBody(photoAltBodySchema),
  updatePhotoAlt,
);
aboutPhotoRouter.delete("/", deletePhoto);
