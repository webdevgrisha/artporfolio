import { Router } from "express";

import type { HealthResponse } from "#modules/health/schema";

export const healthRouter = Router();

healthRouter.get<object, HealthResponse>("/", (_request, response) => {
  response.json({ status: "ok" });
});
