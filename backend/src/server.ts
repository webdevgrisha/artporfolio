import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { aboutRouter } from "#modules/about/routes";
import { protectChanges } from "#modules/auth/middleware";
import { authRouter } from "#modules/auth/routes";
import { contactsRouter } from "#modules/contacts/routes";
import { currencyRates } from "#modules/currencies/resource";
import { currencyRatesBodySchema } from "#modules/currencies/schema";
import { galleryRouter } from "#modules/gallery/routes";
import { healthRouter } from "#modules/health/routes";
import { originalsRouter } from "#modules/originals/routes";
import { pagesRouter } from "#modules/pages/routes";
import { projectsRouter } from "#modules/projects/routes";
import { translationsRouter } from "#modules/translations/routes";
import { uploadsRouter } from "#modules/uploads/routes";
import { corsOptions } from "#shared/config/cors";
import { documentResourceRouter } from "#shared/http/document-resource-router";
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

server.use(protectChanges);

server.use("/api/contacts", contactsRouter);
server.use("/api/originals", originalsRouter);
server.use("/api/pages", pagesRouter);
server.use("/api/about", aboutRouter);
server.use("/api/currencies", documentResourceRouter(currencyRates, currencyRatesBodySchema));
server.use("/api/gallery", galleryRouter);
server.use("/api/projects", projectsRouter);
server.use("/api/translations", translationsRouter);
server.use("/api/uploads", uploadsRouter);

server.use((_request, _response, next) => {
  next(new NotFoundError());
});

server.use(errorHandler);
