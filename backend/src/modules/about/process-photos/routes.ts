import { Router } from "express";

import {
  createProcessPhoto,
  readProcessPhoto,
  readProcessPhotoOrder,
  readProcessPhotos,
  removeProcessPhoto,
  replaceProcessPhotoFile,
  updateProcessPhoto,
  updateProcessPhotoOrder,
} from "#modules/about/process-photos/controller";
import {
  processPhotoOrderBodySchema,
  processPhotoParamsSchema,
} from "#modules/about/process-photos/schema";
import { requireAuth } from "#modules/auth/middleware";
import { photoAltBodySchema } from "#shared/images/photo";
import { maxSourceFileSize } from "#shared/images/processing";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { parseUpload } from "#shared/middleware/upload";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const processPhotosRouter = Router();

const uploadPhoto = parseUpload({ fileField: "file", maxFileSize: maxSourceFileSize });

// Reading is public: the site shows the photos to every visitor. Changes check authentication
// first and the id next, so a rejected request never has its file read.
processPhotosRouter.get("/", readProcessPhotos);
processPhotosRouter.post(
  "/",
  requireAuth,
  requireCsrfToken,
  uploadPhoto,
  validateBody(photoAltBodySchema),
  createProcessPhoto,
);

// Before /:id, so "order" is not taken for a photo id.
processPhotosRouter.get("/order", readProcessPhotoOrder);
processPhotosRouter.put(
  "/order",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  validateBody(processPhotoOrderBodySchema),
  updateProcessPhotoOrder,
);

processPhotosRouter.get("/:id", validateParams(processPhotoParamsSchema), readProcessPhoto);
processPhotosRouter.put(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(processPhotoParamsSchema),
  uploadPhoto,
  validateBody(photoAltBodySchema),
  replaceProcessPhotoFile,
);
processPhotosRouter.patch(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(processPhotoParamsSchema),
  requireContentType("application/json"),
  validateBody(photoAltBodySchema),
  updateProcessPhoto,
);
processPhotosRouter.delete(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(processPhotoParamsSchema),
  removeProcessPhoto,
);
