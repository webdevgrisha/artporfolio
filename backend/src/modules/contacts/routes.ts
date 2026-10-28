import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { readContacts, updateContacts } from "#modules/contacts/controller";
import { photoRouter } from "#modules/contacts/photo/routes";
import { contactsBodySchema } from "#modules/contacts/schema";
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
contactsRouter.use("/photo", photoRouter);
