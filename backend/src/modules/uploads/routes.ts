import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { createUpload } from "#modules/uploads/controller";
import { uploadBodySchema } from "#modules/uploads/schema";
import { maxSourceFileSize } from "#shared/images/processing";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { parseUpload } from "#shared/middleware/upload";
import { validateBody } from "#shared/middleware/validation";

export const uploadsRouter = Router();

// A photo is uploaded here once, and the content refers to it by its id.
// Authentication runs first, so an anonymous request is rejected before its file is read.
uploadsRouter.post(
  "/",
  requireAuth,
  requireCsrfToken,
  parseUpload({ fileField: "file", maxFileSize: maxSourceFileSize }),
  validateBody(uploadBodySchema),
  createUpload,
);
