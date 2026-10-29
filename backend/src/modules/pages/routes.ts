import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { deleteHero, readPages, uploadHero } from "#modules/pages/controller";
import { heroUploadBodySchema, pageParamsSchema } from "#modules/pages/schema";
import { maxSourceFileSize } from "#shared/images/processing";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { parseUpload } from "#shared/middleware/upload";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const pagesRouter = Router();

// Pages are public: the site shows their heroes to every visitor.
pagesRouter.get("/", readPages);

// Authentication runs first and the page is checked next, so a rejected request never has its
// file read.
pagesRouter.put(
  "/:page/hero",
  requireAuth,
  requireCsrfToken,
  validateParams(pageParamsSchema),
  parseUpload({ fileField: "file", maxFileSize: maxSourceFileSize }),
  validateBody(heroUploadBodySchema),
  uploadHero,
);
pagesRouter.delete(
  "/:page/hero",
  requireAuth,
  requireCsrfToken,
  validateParams(pageParamsSchema),
  deleteHero,
);
