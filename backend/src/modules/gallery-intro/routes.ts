import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { readIntro, replaceIntro } from "#modules/gallery-intro/controller";
import { galleryIntroBodySchema } from "#modules/gallery-intro/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const galleryIntroRouter = Router();

// The text is public: the site shows it above the works. A change replaces it, and only the
// text the client read: it sends its ETag in If-Match.
galleryIntroRouter.get("/", readIntro);
galleryIntroRouter.put(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(galleryIntroBodySchema),
  replaceIntro,
);
