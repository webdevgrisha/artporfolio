import { Router } from "express";

import { createUpload } from "#modules/uploads/controller";
import { maxSourceFileSize } from "#shared/images/processing";
import { parseUpload } from "#shared/middleware/upload";

export const uploadsRouter = Router();

// The only multipart route: a photo is uploaded here once, and the content refers to it by its id.
uploadsRouter.post(
  "/",
  parseUpload({ fileField: "file", maxFileSize: maxSourceFileSize }),
  createUpload,
);
