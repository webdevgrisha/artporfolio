import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { putWork, readWork, readWorks, removeWork } from "#modules/gallery-works/controller";
import { workBodySchema, workParamsSchema } from "#modules/gallery-works/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch, requireIfMatchOrCreateOnly } from "#shared/middleware/preconditions";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const galleryWorksRouter = Router();

// Works are public: the gallery shows them to every visitor. A change applies only to the work the
// client read: it sends its ETag in If-Match. The client names a new work itself and creates it
// with PUT and If-None-Match: *, so repeating the request is safe.
galleryWorksRouter.get("/", readWorks);
galleryWorksRouter.get("/:id", validateParams(workParamsSchema), readWork);
galleryWorksRouter.put(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(workParamsSchema),
  requireContentType("application/json"),
  requireIfMatchOrCreateOnly,
  validateBody(workBodySchema),
  putWork,
);
galleryWorksRouter.delete(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(workParamsSchema),
  requireIfMatch,
  removeWork,
);
