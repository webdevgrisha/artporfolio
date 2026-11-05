import { Router } from "express";

import { galleryCollectionsRouter } from "#modules/gallery/collections/routes";
import { galleryColorsRouter } from "#modules/gallery/colors/routes";
import { galleryIntroRouter } from "#modules/gallery/intro/routes";
import { galleryMaterialsRouter } from "#modules/gallery/materials/routes";
import { galleryPalettesRouter } from "#modules/gallery/palettes/routes";
import { gallerySectionsRouter } from "#modules/gallery/sections/routes";
import { galleryWorksRouter } from "#modules/gallery/works/routes";

export const galleryRouter = Router();

galleryRouter.use("/collections", galleryCollectionsRouter);
galleryRouter.use("/colors", galleryColorsRouter);
galleryRouter.use("/intro", galleryIntroRouter);
galleryRouter.use("/materials", galleryMaterialsRouter);
galleryRouter.use("/palettes", galleryPalettesRouter);
galleryRouter.use("/sections", gallerySectionsRouter);
galleryRouter.use("/works", galleryWorksRouter);
