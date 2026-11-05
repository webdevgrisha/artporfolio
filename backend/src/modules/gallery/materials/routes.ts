import { Router } from "express";
import { requireCsrfToken } from "#modules/auth/csrf";
import { requireAuth } from "#modules/auth/middleware";
import { readMaterials, replaceMaterials } from "#modules/gallery/materials/controller";
import { galleryMaterialsBodySchema } from "#modules/gallery/materials/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const galleryMaterialsRouter = Router();

// The materials are public: the site filters the works by them. A change replaces all of them,
// and only the materials the client read: it sends their ETag in If-Match.
galleryMaterialsRouter.get("/", readMaterials);
galleryMaterialsRouter.put(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(galleryMaterialsBodySchema),
  replaceMaterials,
);
