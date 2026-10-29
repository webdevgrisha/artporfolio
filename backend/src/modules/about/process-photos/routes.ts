import { Router } from "express";

import {
  deletePhoto,
  listPhotos,
  readOrder,
  readPhoto,
  replaceOrder,
  replacePhoto,
  updatePhotoAlt,
  uploadPhoto,
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

const parsePhotoUpload = parseUpload({ fileField: "file", maxFileSize: maxSourceFileSize });

// Reading is public: the site shows the photos to every visitor. Changes check authentication
// first and the id next, so a rejected request never has its file read.
processPhotosRouter.get("/", listPhotos);
processPhotosRouter.post(
  "/",
  requireAuth,
  requireCsrfToken,
  parsePhotoUpload,
  validateBody(photoAltBodySchema),
  uploadPhoto,
);

// Before /:id, so "order" is not taken for a photo id.
processPhotosRouter.get("/order", readOrder);
processPhotosRouter.put(
  "/order",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  validateBody(processPhotoOrderBodySchema),
  replaceOrder,
);

processPhotosRouter.get("/:id", validateParams(processPhotoParamsSchema), readPhoto);
processPhotosRouter.put(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(processPhotoParamsSchema),
  parsePhotoUpload,
  validateBody(photoAltBodySchema),
  replacePhoto,
);
processPhotosRouter.patch(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(processPhotoParamsSchema),
  requireContentType("application/json"),
  validateBody(photoAltBodySchema),
  updatePhotoAlt,
);
processPhotosRouter.delete(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(processPhotoParamsSchema),
  deletePhoto,
);
