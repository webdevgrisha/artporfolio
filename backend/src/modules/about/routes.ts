import { Router } from "express";

import { readAbout } from "#modules/about/controller";
import { aboutPhotoRouter } from "#modules/about/photo/routes";
import { processPhotosRouter } from "#modules/about/process-photos/routes";
import { aboutTextRouter } from "#modules/about/text/routes";

export const aboutRouter = Router();

// The About page is public: the site reads it whole. Each part is changed at its own resource.
aboutRouter.get("/", readAbout);
aboutRouter.use("/text", aboutTextRouter);
aboutRouter.use("/photo", aboutPhotoRouter);
aboutRouter.use("/process-photos", processPhotosRouter);
