import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { createUpload } from "#modules/uploads/controller";
import { maxSourceFileSize } from "#shared/images/processing";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { parseUpload } from "#shared/middleware/upload";

export const uploadsRouter = Router();

// The only multipart route: a photo is uploaded here once, and the content refers to it by its id.
// Authentication runs first, so an anonymous request is rejected before its file is parsed.
uploadsRouter.post(
  "/",
  requireAuth,
  requireCsrfToken,
  parseUpload({ fileField: "file", maxFileSize: maxSourceFileSize }),
  createUpload,
);
