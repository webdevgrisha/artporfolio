import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import { corsOptions } from "#config/corsConfig";
import { NotFoundError } from "#errors/httpError";
import { errorHandler } from "#middleware/error/index";
import { authRouter, healthRouter } from "#routes/index";

export const server = express();

server.use(helmet());
server.use(cors(corsOptions));
server.use(cookieParser());
server.use(express.json());

server.use("/api/health", healthRouter);
server.use("/api/auth", authRouter);

server.use((_request, _response, next) => {
  next(new NotFoundError());
});

server.use(errorHandler);
