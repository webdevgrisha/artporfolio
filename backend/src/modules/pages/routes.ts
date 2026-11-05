import { Router } from "express";

import { putHero, readHero, readPages } from "#modules/pages/controller";
import { heroBodySchema, pageParamsSchema } from "#modules/pages/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const pagesRouter = Router();

// Pages are public: the site shows their heroes to every visitor. A change applies only to the
// hero the client read: it sends its ETag in If-Match. A hero can be replaced, never removed: the
// site does not show a page without one.
pagesRouter.get("/", readPages);
pagesRouter.get("/:page/hero", validateParams(pageParamsSchema), readHero);

pagesRouter.put(
  "/:page/hero",
  validateParams(pageParamsSchema),
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(heroBodySchema),
  putHero,
);
