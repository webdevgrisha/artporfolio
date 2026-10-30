import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { photoSlotController } from "#modules/photo-slot/controller";
import { type PhotoSlot, photoAltBodySchema, photoBodySchema } from "#shared/images/photo";
import { mergePatchType, requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

/**
 * The resource of one photo slot. The photo is public: the site shows it to every visitor. A
 * change applies only to the photo the client read: it sends its ETag in If-Match.
 */
export function photoSlotRouter(slot: PhotoSlot): Router {
  const { patchAlt, putPhoto, readPhoto, removePhoto } = photoSlotController(slot);
  const router = Router();

  router.get("/", readPhoto);
  router.put(
    "/",
    requireAuth,
    requireCsrfToken,
    requireContentType("application/json"),
    requireIfMatch,
    validateBody(photoBodySchema),
    putPhoto,
  );
  router.patch(
    "/",
    requireAuth,
    requireCsrfToken,
    requireContentType(mergePatchType),
    requireIfMatch,
    validateBody(photoAltBodySchema),
    patchAlt,
  );
  router.delete("/", requireAuth, requireCsrfToken, requireIfMatch, removePhoto);

  return router;
}
