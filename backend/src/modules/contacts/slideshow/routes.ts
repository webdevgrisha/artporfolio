import { Router } from "express";

import { changeSlideshow, readSlideshow } from "#modules/contacts/slideshow/controller";
import { slideshowBodySchema } from "#modules/contacts/slideshow/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const slideshowRouter = Router();

// The slideshow is one resource: reading it is public, as the site shows it to every visitor, and
// a change replaces all of it, so it is saved all or nothing.
slideshowRouter.get("/", readSlideshow);
slideshowRouter.put(
  "/",
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(slideshowBodySchema),
  changeSlideshow,
);
