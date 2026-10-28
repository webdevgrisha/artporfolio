import { Router } from "express";

import { readContacts, updateContacts } from "#controllers/contacts";
import { requireAuth } from "#middleware/auth";
import { requireCsrfToken } from "#middleware/csrf";
import { validateBody } from "#middleware/validation";
import { contactsBodySchema } from "#schemas/contacts";

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
