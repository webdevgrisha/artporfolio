import { Router } from "express";

import { getHealth } from "#controllers/health/index";

export const healthRouter = Router();

healthRouter.get("/", getHealth);
