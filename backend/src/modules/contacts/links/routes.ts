import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { readLinks, replaceLinks } from "#modules/contacts/links/controller";
import { contactLinksBodySchema } from "#modules/contacts/links/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const linksRouter = Router();

// The links are public: the site shows them to every visitor. A change replaces all of them, and
// only the links the client read: it sends their ETag in If-Match.
linksRouter.get("/", readLinks);
linksRouter.put(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(contactLinksBodySchema),
  replaceLinks,
);
