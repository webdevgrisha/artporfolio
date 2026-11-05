import { Router } from "express";
import { requireCsrfToken } from "#modules/auth/csrf";
import { requireAuth } from "#modules/auth/middleware";
import {
  putSection,
  readSection,
  readSections,
  removeSection,
} from "#modules/gallery/sections/controller";
import { sectionBodySchema, sectionParamsSchema } from "#modules/gallery/sections/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireIfMatch, requireIfMatchOrCreateOnly } from "#shared/middleware/preconditions";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const gallerySectionsRouter = Router();

// Sections are public: the site lists them in the gallery. A change applies only to the section
// the client read: it sends its ETag in If-Match. The client names a new section itself and
// creates it with PUT and If-None-Match: *, so repeating the request is safe.
gallerySectionsRouter.get("/", readSections);
gallerySectionsRouter.get("/:id", validateParams(sectionParamsSchema), readSection);
gallerySectionsRouter.put(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(sectionParamsSchema),
  requireContentType("application/json"),
  requireIfMatchOrCreateOnly,
  validateBody(sectionBodySchema),
  putSection,
);
gallerySectionsRouter.delete(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(sectionParamsSchema),
  requireIfMatch,
  removeSection,
);
