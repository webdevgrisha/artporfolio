import { Router } from "express";

import { requireAuth } from "#modules/auth/middleware";
import {
  postProject,
  putOrder,
  putProject,
  readOrder,
  readProject,
  readProjects,
  removeProject,
} from "#modules/projects/controller";
import {
  projectBodySchema,
  projectParamsSchema,
  projectsOrderBodySchema,
} from "#modules/projects/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireCsrfToken } from "#shared/middleware/csrf";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const projectsRouter = Router();

// Projects are public: the site shows them to every visitor. A change applies only to the project,
// or the order, the client read: it sends its ETag in If-Match. A new project needs none.
projectsRouter.get("/", readProjects);
projectsRouter.post(
  "/",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  validateBody(projectBodySchema),
  postProject,
);

// Registered before "/:id", which takes only UUIDs anyway.
projectsRouter.get("/order", readOrder);
projectsRouter.put(
  "/order",
  requireAuth,
  requireCsrfToken,
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(projectsOrderBodySchema),
  putOrder,
);

projectsRouter.get("/:id", validateParams(projectParamsSchema), readProject);
projectsRouter.put(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(projectParamsSchema),
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(projectBodySchema),
  putProject,
);
projectsRouter.delete(
  "/:id",
  requireAuth,
  requireCsrfToken,
  validateParams(projectParamsSchema),
  requireIfMatch,
  removeProject,
);
