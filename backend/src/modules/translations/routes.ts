import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import {
  patchTranslations,
  readStatus,
  readTranslations,
  retry,
} from "#modules/translations/controller";
import {
  languageParamsSchema,
  resourceParamsSchema,
  translationPatchBodySchema,
} from "#modules/translations/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const translationsRouter = Router();

// Translations are the admin's for now: they hold the texts of hidden works too. The site will read
// them through its own resources, which know what a visitor may see.

// Registered before "/:resource", which would take these names too.
translationsRouter.get("/status", requireAuth, readStatus);
translationsRouter.post("/retry", retry);

// A person's change names only the texts it changes, so it cannot overwrite what it did not touch,
// and each text names the source it was written from, so an edit of an older source shows as out of
// date. Hence no If-Match: the translator changes the resource at any moment, and an ETag with it.
translationsRouter.get(
  "/:resource",
  requireAuth,
  validateParams(resourceParamsSchema),
  readTranslations,
);
translationsRouter.patch(
  "/:resource/:language",
  requireContentType("application/json"),
  validateParams(languageParamsSchema),
  validateBody(translationPatchBodySchema),
  patchTranslations,
);
