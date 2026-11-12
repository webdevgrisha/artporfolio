import { Router } from "express";

import { readAbout } from "#modules/about/controller";
import { aboutPhoto } from "#modules/about/photo";
import { processPhotosRouter } from "#modules/about/process-photos/routes";
import { aboutText } from "#modules/about/text/resource";
import { aboutTextBodySchema } from "#modules/about/text/schema";
import { documentResourceRouter } from "#shared/http/document-resource-router";
import { photoSlotRouter } from "#shared/http/photo-slot-router";
import { languageQuerySchema } from "#shared/i18n/language-query";
import { validateQuery } from "#shared/middleware/validation";

export const aboutRouter = Router();

// The About page is public: the site reads it whole, with the texts in the language of its page
// (`?lang=`). Each part is changed at its own resource.
aboutRouter.get("/", validateQuery(languageQuerySchema), readAbout);
aboutRouter.use("/text", documentResourceRouter(aboutText, aboutTextBodySchema));
aboutRouter.use("/photo", photoSlotRouter(aboutPhoto));
aboutRouter.use("/process-photos", processPhotosRouter);
