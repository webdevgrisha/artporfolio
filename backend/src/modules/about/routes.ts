import { Router } from "express";

import { readAbout, updateAboutText } from "#modules/about/controller";
import { aboutPhotoRouter } from "#modules/about/photo/routes";
import { processPhotosRouter } from "#modules/about/process-photos/routes";
import { aboutTextBodySchema } from "#modules/about/schema";
import { requireAuth } from "#modules/auth/middleware";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { validateBody } from "#shared/middleware/validation";

export const aboutRouter = Router();

// The About page is public: the site shows it to every visitor.
aboutRouter.get("/", readAbout);
aboutRouter.put(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  validateBody(aboutTextBodySchema),
  updateAboutText,
);
aboutRouter.use("/photo", aboutPhotoRouter);
aboutRouter.use("/process-photos", processPhotosRouter);
