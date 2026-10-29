import { Router } from "express";

import { deletePhoto, updatePhotoAlt, uploadPhoto } from "#modules/about/photo/controller";
import { requireAuth } from "#modules/auth/middleware";
import { photoAltBodySchema } from "#shared/images/photo";
import { maxSourceFileSize } from "#shared/images/processing";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { parseUpload } from "#shared/middleware/upload";
import { validateBody } from "#shared/middleware/validation";

export const aboutPhotoRouter = Router();

// Authentication runs first, so an anonymous request is rejected before its file is read.
aboutPhotoRouter.use(requireAuth, requireCsrfToken);

aboutPhotoRouter.put(
  "/",
  parseUpload({ fileField: "file", maxFileSize: maxSourceFileSize }),
  validateBody(photoAltBodySchema),
  uploadPhoto,
);
aboutPhotoRouter.patch(
  "/",
  requireContentType("application/json"),
  validateBody(photoAltBodySchema),
  updatePhotoAlt,
);
aboutPhotoRouter.delete("/", deletePhoto);
