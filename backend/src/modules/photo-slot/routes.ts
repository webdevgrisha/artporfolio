import { Router } from "express";

import { photoSlotController } from "#modules/photo-slot/controller";
import { type PhotoSlot, photoBodySchema } from "#shared/images/photo";
import { requireContentType } from "#shared/middleware/content-type";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

/**
 * The resource of one photo slot. The photo is public: the site shows it to every visitor. A
 * change applies only to the photo the client read: it sends its ETag in If-Match. A photo can be
 * replaced, never removed: the site does not show the page without it.
 */
export function photoSlotRouter(slot: PhotoSlot): Router {
  const { putPhoto, readPhoto } = photoSlotController(slot);
  const router = Router();

  router.get("/", readPhoto);
  router.put(
    "/",
    requireContentType("application/json"),
    requireIfMatch,
    validateBody(photoBodySchema),
    putPhoto,
  );

  return router;
}
