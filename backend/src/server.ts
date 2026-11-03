import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { aboutRouter } from "#modules/about/routes";
import { authRouter } from "#modules/auth/routes";
import { contactsRouter } from "#modules/contacts/routes";
import { galleryColorsRouter } from "#modules/gallery-colors/routes";
import { galleryIntroRouter } from "#modules/gallery-intro/routes";
import { galleryMaterialsRouter } from "#modules/gallery-materials/routes";
import { galleryPalettesRouter } from "#modules/gallery-palettes/routes";
import { gallerySectionsRouter } from "#modules/gallery-sections/routes";
import { healthRouter } from "#modules/health/routes";
import { pagesRouter } from "#modules/pages/routes";
import { projectsRouter } from "#modules/projects/routes";
import { projectsIntroRouter } from "#modules/projects-intro/routes";
import { uploadsRouter } from "#modules/uploads/routes";
import { corsOptions } from "#shared/config/cors";
import { NotFoundError } from "#shared/http/errors";
import { parseJsonBody } from "#shared/middleware/content-type";
import { errorHandler } from "#shared/middleware/error";

export const server = express();

server.use(helmet());
server.use(cors(corsOptions));
server.use(cookieParser());
server.use(parseJsonBody);

server.use("/api/health", healthRouter);
server.use("/api/auth", authRouter);
server.use("/api/contacts", contactsRouter);
server.use("/api/pages", pagesRouter);
server.use("/api/about", aboutRouter);
server.use("/api/gallery-colors", galleryColorsRouter);
server.use("/api/gallery-intro", galleryIntroRouter);
server.use("/api/gallery-materials", galleryMaterialsRouter);
server.use("/api/gallery-palettes", galleryPalettesRouter);
server.use("/api/gallery-sections", gallerySectionsRouter);
server.use("/api/projects", projectsRouter);
server.use("/api/projects-intro", projectsIntroRouter);
server.use("/api/uploads", uploadsRouter);

server.use((_request, _response, next) => {
  next(new NotFoundError());
});

server.use(errorHandler);
