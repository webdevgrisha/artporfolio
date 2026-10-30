import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import {
  deletePhoto,
  putPhoto,
  readPhoto,
  updatePhotoAlt,
} from "#modules/contacts/photo/controller";
import { photoAltBodySchema, photoBodySchema } from "#shared/images/photo";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const photoRouter = Router();

// The photo is public: the site shows it to every visitor. A change applies only to the photo the
// client read: it sends its ETag in If-Match.
photoRouter.get("/", readPhoto);
photoRouter.put(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(photoBodySchema),
  putPhoto,
);
photoRouter.patch(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(photoAltBodySchema),
  updatePhotoAlt,
);
photoRouter.delete("/", requireAuth, requireCsrfToken, requireIfMatch, deletePhoto);
