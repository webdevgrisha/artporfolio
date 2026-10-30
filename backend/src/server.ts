import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { aboutRouter } from "#modules/about/routes";
import { authRouter } from "#modules/auth/routes";
import { contactsRouter } from "#modules/contacts/routes";
import { healthRouter } from "#modules/health/routes";
import { pagesRouter } from "#modules/pages/routes";
import { uploadsRouter } from "#modules/uploads/routes";
import { corsOptions } from "#shared/config/cors";
import { NotFoundError } from "#shared/http/errors";
import { errorHandler } from "#shared/middleware/error";

export const server = express();

server.use(helmet());
server.use(cors(corsOptions));
server.use(cookieParser());
server.use(express.json());

server.use("/api/health", healthRouter);
server.use("/api/auth", authRouter);
server.use("/api/contacts", contactsRouter);
server.use("/api/pages", pagesRouter);
server.use("/api/about", aboutRouter);
server.use("/api/uploads", uploadsRouter);

server.use((_request, _response, next) => {
  next(new NotFoundError());
});

server.use(errorHandler);
