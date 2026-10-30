import { Router } from "express";
import { deletePhoto, putPhoto, readPhoto, updatePhotoAlt } from "#modules/about/photo/controller";
import { requireAuth } from "#modules/auth/middleware";
import { photoAltBodySchema, photoBodySchema } from "#shared/images/photo";
import { mergePatchType, requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const aboutPhotoRouter = Router();

// The photo is public: the site shows it to every visitor. A change applies only to the photo the
// client read: it sends its ETag in If-Match.
aboutPhotoRouter.get("/", readPhoto);
aboutPhotoRouter.put(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(photoBodySchema),
  putPhoto,
);
aboutPhotoRouter.patch(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType(mergePatchType),
  requireIfMatch,
  validateBody(photoAltBodySchema),
  updatePhotoAlt,
);
aboutPhotoRouter.delete("/", requireAuth, requireCsrfToken, requireIfMatch, deletePhoto);
