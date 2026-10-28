import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { corsOptions } from "#config/cors";
import { NotFoundError } from "#errors/httpError";
import { errorHandler } from "#middleware/error";
import { authRouter } from "#routes/auth";
import { contactPhotoRouter } from "#routes/contactPhoto";
import { contactsRouter } from "#routes/contacts";
import { healthRouter } from "#routes/health";

export const server = express();

server.use(helmet());
server.use(cors(corsOptions));
server.use(cookieParser());
server.use(express.json());

server.use("/api/health", healthRouter);
server.use("/api/auth", authRouter);
server.use("/api/contacts/photo", contactPhotoRouter);
server.use("/api/contacts", contactsRouter);

server.use((_request, _response, next) => {
  next(new NotFoundError());
});

server.use(errorHandler);
