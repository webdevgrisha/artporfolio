import cookieParser from "cookie-parser";
import express, { type Router } from "express";

import { authRouter } from "#modules/auth/routes";
import { parseJsonBody } from "#shared/middleware/content-type";
import { errorHandler } from "#shared/middleware/error";

/**
 * An app with the global middleware of server.ts, the auth routes that adminHeaders needs, and
 * the router under test.
 */
export function routeApp(path: string, router: Router): express.Express {
  const app = express();

  app.use(cookieParser());
  app.use(parseJsonBody);
  app.use("/api/auth", authRouter);
  app.use(path, router);
  app.use(errorHandler);

  return app;
}
