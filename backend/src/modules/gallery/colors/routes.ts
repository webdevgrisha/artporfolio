import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { readColors, replaceColors } from "#modules/gallery/colors/controller";
import { galleryColorsBodySchema } from "#modules/gallery/colors/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const galleryColorsRouter = Router();

// The colors are public: the site filters the works by them. A change replaces all of them,
// and only the colors the client read: it sends their ETag in If-Match.
galleryColorsRouter.get("/", readColors);
galleryColorsRouter.put(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(galleryColorsBodySchema),
  replaceColors,
);
