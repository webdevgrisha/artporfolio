import { Router } from "express";
import { requireCsrfToken } from "#modules/auth/csrf";
import { requireAuth } from "#modules/auth/middleware";
import { readRates, replaceRates } from "#modules/currencies/controller";
import { currencyRatesBodySchema } from "#modules/currencies/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const currenciesRouter = Router();

// The rates are public: the site shows prices by them. A change replaces all of them, and only the
// rates the client read: it sends their ETag in If-Match.
currenciesRouter.get("/", readRates);
currenciesRouter.put(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(currencyRatesBodySchema),
  replaceRates,
);
