import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { deletePhoto, updatePhotoAlt, uploadPhoto } from "#modules/contacts/photo/controller";
import { photoAltBodySchema } from "#modules/contacts/photo/schema";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { parseUpload } from "#shared/middleware/upload";
import { validateBody } from "#shared/middleware/validation";

const maxPhotoSize = 15 * 1024 * 1024;

export const photoRouter = Router();

// Authentication runs first, so an anonymous request is rejected before its file is read.
photoRouter.use(requireAuth, requireCsrfToken);

photoRouter.put(
  "/",
  parseUpload({ fileField: "file", maxFileSize: maxPhotoSize }),
  validateBody(photoAltBodySchema),
  uploadPhoto,
);
photoRouter.patch("/", validateBody(photoAltBodySchema), updatePhotoAlt);
photoRouter.delete("/", deletePhoto);
