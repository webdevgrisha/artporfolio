import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { deleteHero, putHero, readHero, readPages } from "#modules/pages/controller";
import { heroBodySchema, pageParamsSchema } from "#modules/pages/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const pagesRouter = Router();

// Pages are public: the site shows their heroes to every visitor. A change applies only to the
// hero the client read: it sends its ETag in If-Match.
pagesRouter.get("/", readPages);
pagesRouter.get("/:page/hero", validateParams(pageParamsSchema), readHero);

pagesRouter.put(
  "/:page/hero",
  requireAuth,
  requireCsrfToken,
  validateParams(pageParamsSchema),
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(heroBodySchema),
  putHero,
);
pagesRouter.delete(
  "/:page/hero",
  requireAuth,
  requireCsrfToken,
  validateParams(pageParamsSchema),
  requireIfMatch,
  deleteHero,
);
