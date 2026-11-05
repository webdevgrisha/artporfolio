import { Router } from "express";

import { readPalettes, replacePalettes } from "#modules/gallery/palettes/controller";
import { galleryPalettesBodySchema } from "#modules/gallery/palettes/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const galleryPalettesRouter = Router();

// The palettes are public: the site filters the works by them. A change replaces all of them,
// and only the palettes the client read: it sends their ETag in If-Match.
galleryPalettesRouter.get("/", readPalettes);
galleryPalettesRouter.put(
  "/",
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(galleryPalettesBodySchema),
  replacePalettes,
);
