import type { RequestHandler } from "express";

import { getHealthStatus } from "#services/health/index";

export const getHealth: RequestHandler = (_request, response) => {
  response.json(getHealthStatus());
};
