import { Router } from "express";

import { galleryCollectionsRouter } from "#modules/gallery/collections/routes";
import { galleryColors } from "#modules/gallery/colors/resource";
import { galleryColorsBodySchema } from "#modules/gallery/colors/schema";
import { galleryIntro } from "#modules/gallery/intro/resource";
import { galleryIntroBodySchema } from "#modules/gallery/intro/schema";
import { galleryMaterials } from "#modules/gallery/materials/resource";
import { galleryMaterialsBodySchema } from "#modules/gallery/materials/schema";
import { galleryPalettes } from "#modules/gallery/palettes/resource";
import { galleryPalettesBodySchema } from "#modules/gallery/palettes/schema";
import { gallerySectionsRouter } from "#modules/gallery/sections/routes";
import { galleryWorksRouter } from "#modules/gallery/works/routes";
import { documentResourceRouter } from "#shared/http/document-resource";

export const galleryRouter = Router();

galleryRouter.use("/collections", galleryCollectionsRouter);
galleryRouter.use("/colors", documentResourceRouter(galleryColors, galleryColorsBodySchema));
galleryRouter.use("/intro", documentResourceRouter(galleryIntro, galleryIntroBodySchema));
galleryRouter.use(
  "/materials",
  documentResourceRouter(galleryMaterials, galleryMaterialsBodySchema),
);
galleryRouter.use("/palettes", documentResourceRouter(galleryPalettes, galleryPalettesBodySchema));
galleryRouter.use("/sections", gallerySectionsRouter);
galleryRouter.use("/works", galleryWorksRouter);
