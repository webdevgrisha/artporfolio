import { Router } from "express";

import { readContacts } from "#modules/contacts/controller";
import { contactLinks } from "#modules/contacts/links/resource";
import { contactLinksBodySchema } from "#modules/contacts/links/schema";
import { contactPhoto } from "#modules/contacts/photo";
import { documentResourceRouter } from "#shared/http/document-resource-router";
import { photoSlotRouter } from "#shared/http/photo-slot-router";
import { languageQuerySchema } from "#shared/i18n/language-query";
import { validateQuery } from "#shared/middleware/validation";

export const contactsRouter = Router();

// Contacts are public: the site reads them whole, with the texts in the language of its page
// (`?lang=`). Each part is changed at its own resource.
contactsRouter.get("/", validateQuery(languageQuerySchema), readContacts);
contactsRouter.use("/links", documentResourceRouter(contactLinks, contactLinksBodySchema));
contactsRouter.use("/photo", photoSlotRouter(contactPhoto));
