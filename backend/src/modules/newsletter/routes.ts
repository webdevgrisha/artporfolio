import { Router } from "express";

import { createSubscriber } from "#modules/newsletter/controller";
import { subscribeBodySchema } from "#modules/newsletter/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { validateBody } from "#shared/middleware/validation";

export const newsletterRouter = Router();

// A visitor subscribes without a session, so the router is mounted before protectChanges and each
// route of the admin added here later protects itself. Requiring JSON keeps out the cross-site
// forms, which cannot send it.
newsletterRouter.post(
  "/subscribers",
  requireContentType("application/json"),
  validateBody(subscribeBodySchema),
  createSubscriber,
);
