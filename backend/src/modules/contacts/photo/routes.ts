import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { deletePhoto, updatePhotoAlt, uploadPhoto } from "#modules/contacts/photo/controller";
import { photoAltBodySchema } from "#shared/images/photo";
import { maxSourceFileSize } from "#shared/images/processing";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { parseUpload } from "#shared/middleware/upload";
import { validateBody } from "#shared/middleware/validation";

export const photoRouter = Router();

// Authentication runs first, so an anonymous request is rejected before its file is read.
photoRouter.use(requireAuth, requireCsrfToken);

photoRouter.put(
  "/",
  parseUpload({ fileField: "file", maxFileSize: maxSourceFileSize }),
  validateBody(photoAltBodySchema),
  uploadPhoto,
);
photoRouter.patch(
  "/",
  requireContentType("application/json"),
  validateBody(photoAltBodySchema),
  updatePhotoAlt,
);
photoRouter.delete("/", deletePhoto);
