import { Router } from "express";

import { identifyReader } from "#modules/auth/middleware";
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

// Registered before "/:resource", which would take these names too.
translationsRouter.get("/status", identifyReader, readStatus);
translationsRouter.post("/retry", retry);

// The translations are public: the site shows them to every visitor. A person's change names only
// the texts it changes, so it needs no If-Match: it cannot overwrite what it did not touch.
translationsRouter.get("/:resource", validateParams(resourceParamsSchema), readTranslations);
translationsRouter.patch(
  "/:resource/:language",
  requireContentType("application/json"),
  validateParams(languageParamsSchema),
  validateBody(translationPatchBodySchema),
  patchTranslations,
);
