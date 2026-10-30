import { Router } from "express";

import { readContacts } from "#modules/contacts/controller";
import { linksRouter } from "#modules/contacts/links/routes";
import { photoRouter } from "#modules/contacts/photo/routes";

export const contactsRouter = Router();

// Contacts are public: the site reads them whole. Each part is changed at its own resource.
contactsRouter.get("/", readContacts);
contactsRouter.use("/links", linksRouter);
contactsRouter.use("/photo", photoRouter);
