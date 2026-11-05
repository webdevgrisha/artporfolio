import cookieParser from "cookie-parser";
import express, { type RequestHandler, type Router } from "express";

import { authRouter } from "#modules/auth/routes";
import { parseJsonBody } from "#shared/middleware/content-type";
import { errorHandler } from "#shared/middleware/error";

// Cloud Functions reads the body before Express does and leaves it in request.rawBody.
export const readMultipartLikeCloudFunctions = express.raw({ type: "multipart/form-data" });

export const moveBodyToRawBody: RequestHandler = (request, _response, next) => {
  if (Buffer.isBuffer(request.body)) {
    request.rawBody = request.body;
  }

  next();
};

/**
 * An app with the global middleware of server.ts, the auth routes that adminHeaders needs, and
 * the router under test.
 */
export function routeApp(path: string, router: Router): express.Express {
  const app = express();

  app.use(readMultipartLikeCloudFunctions);
  app.use(moveBodyToRawBody);
  app.use(cookieParser());
  app.use(parseJsonBody);
  app.use("/api/auth", authRouter);
  app.use(path, router);
  app.use(errorHandler);

  return app;
}
