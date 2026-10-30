import { Router } from "express";

import { listPhotos, replacePhotos } from "#modules/about/process-photos/controller";
import { processPhotosBodySchema } from "#modules/about/process-photos/schema";
import { requireAuth } from "#modules/auth/middleware";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const processPhotosRouter = Router();

// The photos are one list: reading it is public, as the site shows it to every visitor, and a
// change replaces all of it, so it is saved all or nothing.
processPhotosRouter.get("/", listPhotos);
processPhotosRouter.put(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(processPhotosBodySchema),
  replacePhotos,
);
