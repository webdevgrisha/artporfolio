import { Router } from "express";

import { readContacts } from "#modules/contacts/controller";
import { contactLinks } from "#modules/contacts/links/resource";
import { contactLinksBodySchema } from "#modules/contacts/links/schema";
import { contactPhoto } from "#modules/contacts/photo";
import { photoSlotRouter } from "#modules/photo-slot/routes";
import { documentResourceRouter } from "#shared/http/document-resource";

export const contactsRouter = Router();

// Contacts are public: the site reads them whole. Each part is changed at its own resource.
contactsRouter.get("/", readContacts);
contactsRouter.use("/links", documentResourceRouter(contactLinks, contactLinksBodySchema));
contactsRouter.use("/photo", photoSlotRouter(contactPhoto));
