import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { deleteHero, putHero, readPages } from "#modules/pages/controller";
import { heroBodySchema, pageParamsSchema } from "#modules/pages/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const pagesRouter = Router();

// Pages are public: the site shows their heroes to every visitor.
pagesRouter.get("/", readPages);

pagesRouter.put(
  "/:page/hero",
  requireAuth,
  requireCsrfToken,
  validateParams(pageParamsSchema),
  requireContentType("application/json"),
  validateBody(heroBodySchema),
  putHero,
);
pagesRouter.delete(
  "/:page/hero",
  requireAuth,
  requireCsrfToken,
  validateParams(pageParamsSchema),
  deleteHero,
);
