import { Router } from "express";

import { deletePhoto, updatePhotoAlt, uploadPhoto } from "#controllers/contactPhoto";
import { requireAuth } from "#middleware/auth";
import { requireCsrfToken } from "#middleware/csrf";
import { parseUpload } from "#middleware/upload";
import { validateBody } from "#middleware/validation";
import { photoAltBodySchema } from "#schemas/contactPhoto";

const maxPhotoSize = 15 * 1024 * 1024;

export const contactPhotoRouter = Router();

// Authentication runs first, so an anonymous request is rejected before its file is read.
contactPhotoRouter.use(requireAuth, requireCsrfToken);

contactPhotoRouter.put(
  "/",
  parseUpload({ fileField: "file", maxFileSize: maxPhotoSize }),
  validateBody(photoAltBodySchema),
  uploadPhoto,
);
contactPhotoRouter.patch("/", validateBody(photoAltBodySchema), updatePhotoAlt);
contactPhotoRouter.delete("/", deletePhoto);
