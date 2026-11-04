import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import {
  putCollection,
  readCollection,
  readCollections,
  removeCollection,
} from "#modules/gallery-collections/controller";
import { collectionBodySchema, collectionParamsSchema } from "#modules/gallery-collections/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch, requireIfMatchOrCreateOnly } from "#shared/middleware/preconditions";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const galleryCollectionsRouter = Router();

// Collections are public: the gallery shows them to every visitor. A change applies only to the
// collection the client read: it sends its ETag in If-Match. The client names a new collection
// itself and creates it with PUT and If-None-Match: *, so repeating the request is safe.
galleryCollectionsRouter.get("/", readCollections);
galleryCollectionsRouter.get("/:id", validateParams(collectionParamsSchema), readCollection);
galleryCollectionsRouter.put(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(collectionParamsSchema),
  requireContentType("application/json"),
  requireIfMatchOrCreateOnly,
  validateBody(collectionBodySchema),
  putCollection,
);
galleryCollectionsRouter.delete(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(collectionParamsSchema),
  requireIfMatch,
  removeCollection,
);
