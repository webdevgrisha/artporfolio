import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import { downloadOriginal } from "#modules/originals/controller";
import { originalParamsSchema } from "#modules/originals/schema";
import { validateParams } from "#shared/middleware/validation";

export const originalsRouter = Router();

// The files the admin uploaded, as they were uploaded; the site shows only the web images.
originalsRouter.get("/*path", requireAuth, validateParams(originalParamsSchema), downloadOriginal);
