import { Router } from "express";

import { readText, replaceText } from "#modules/about/text/controller";
import { aboutTextBodySchema } from "#modules/about/text/schema";
import { requireAuth } from "#modules/auth/middleware";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const aboutTextRouter = Router();

// The texts are public: the site shows them to every visitor. A change replaces all of them, and
// only the texts the client read: it sends their ETag in If-Match.
aboutTextRouter.get("/", readText);
aboutTextRouter.put(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(aboutTextBodySchema),
  replaceText,
);
