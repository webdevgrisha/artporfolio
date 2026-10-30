import { Router } from "express";

import { readContacts } from "#modules/contacts/controller";
import { linksRouter } from "#modules/contacts/links/routes";
import { contactPhoto } from "#modules/contacts/photo";
import { photoSlotRouter } from "#modules/photo-slot/routes";

export const contactsRouter = Router();

// Contacts are public: the site reads them whole. Each part is changed at its own resource.
contactsRouter.get("/", readContacts);
contactsRouter.use("/links", linksRouter);
contactsRouter.use("/photo", photoSlotRouter(contactPhoto));
