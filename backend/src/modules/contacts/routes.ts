import { Router } from "express";

import { readContacts } from "#modules/contacts/controller";
import { contactLinks } from "#modules/contacts/links/resource";
import { contactLinksBodySchema } from "#modules/contacts/links/schema";
import { slideshowRouter } from "#modules/contacts/slideshow/routes";
import { documentResourceRouter } from "#shared/http/document-resource-router";
import { languageQuerySchema } from "#shared/i18n/language-query";
import { validateQuery } from "#shared/middleware/validation";

export const contactsRouter = Router();

// Contacts are public: the site reads them whole, with the texts in the language of its page
// (`?lang=`). Each part is changed at its own resource.
contactsRouter.get("/", validateQuery(languageQuerySchema), readContacts);
contactsRouter.use("/links", documentResourceRouter(contactLinks, contactLinksBodySchema));
contactsRouter.use("/slideshow", slideshowRouter);
