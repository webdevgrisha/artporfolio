import { Router } from "express";

import { identifyReader, requireAuth } from "#modules/auth/middleware";
import {
  putWork,
  readWork,
  readWorks,
  readWorkUsage,
  removeWork,
} from "#modules/gallery/works/controller";
import { workBodySchema, workParamsSchema } from "#modules/gallery/works/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch, requireIfMatchOrCreateOnly } from "#shared/middleware/preconditions";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const galleryWorksRouter = Router();

// Works are public: the gallery shows the published ones to every visitor, and the admin sees the
// hidden ones too. A change applies only to the work the client read: it sends its ETag in
// If-Match. The client names a new work itself and creates it with PUT and If-None-Match: *, so
// repeating the request is safe.
galleryWorksRouter.get("/", identifyReader, readWorks);
// How many works name each section, material, color and palette: a few numbers instead of every
// work. Before /:id, which takes only a UUID.
galleryWorksRouter.get("/usage", identifyReader, readWorkUsage);
galleryWorksRouter.get("/:id", identifyReader, validateParams(workParamsSchema), readWork);
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
