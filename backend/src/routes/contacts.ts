import { Router } from "express";

import { readContacts, updateContacts } from "#controllers/contacts";
import { requireAuth } from "#modules/auth/middleware";
import { contactsBodySchema } from "#schemas/contacts";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { validateBody } from "#shared/middleware/validation";

export const contactsRouter = Router();

// Contacts are public: the site shows them to every visitor.
contactsRouter.get("/", readContacts);
contactsRouter.put(
  "/",
  requireAuth,
  requireCsrfToken,
  validateBody(contactsBodySchema),
  updateContacts,
);
