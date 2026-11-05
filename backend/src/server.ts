import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { aboutRouter } from "#modules/about/routes";
import { authRouter } from "#modules/auth/routes";
import { contactsRouter } from "#modules/contacts/routes";
import { currenciesRouter } from "#modules/currencies/routes";
import { galleryRouter } from "#modules/gallery/routes";
import { healthRouter } from "#modules/health/routes";
import { originalsRouter } from "#modules/originals/routes";
import { pagesRouter } from "#modules/pages/routes";
import { projectsRouter } from "#modules/projects/routes";
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
server.use("/api/originals", originalsRouter);
server.use("/api/pages", pagesRouter);
server.use("/api/about", aboutRouter);
server.use("/api/currencies", currenciesRouter);
server.use("/api/gallery", galleryRouter);
server.use("/api/projects", projectsRouter);
server.use("/api/uploads", uploadsRouter);

server.use((_request, _response, next) => {
  next(new NotFoundError());
});

server.use(errorHandler);
