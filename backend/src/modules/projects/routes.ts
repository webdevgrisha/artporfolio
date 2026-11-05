import { Router } from "express";

import {
  putOrder,
  putProject,
  readOrder,
  readProject,
  readProjects,
  removeProject,
} from "#modules/projects/controller";
import { projectsIntro } from "#modules/projects/intro/resource";
import { projectsIntroBodySchema } from "#modules/projects/intro/schema";
import {
  projectBodySchema,
  projectParamsSchema,
  projectsOrderBodySchema,
} from "#modules/projects/schema";
import { documentResourceRouter } from "#shared/http/document-resource";
import { requireContentType } from "#shared/middleware/content-type";
import { requireIfMatch, requireIfMatchOrCreateOnly } from "#shared/middleware/preconditions";
import { validateBody, validateParams } from "#shared/middleware/validation";

export const projectsRouter = Router();

// Projects are public: the site shows them to every visitor. A change applies only to the project,
// or the order, the client read: it sends its ETag in If-Match. The client names a new project
// itself and creates it with PUT and If-None-Match: *, so repeating the request is safe.
projectsRouter.get("/", readProjects);

// Registered before "/:id", which takes only UUIDs anyway.
projectsRouter.use("/intro", documentResourceRouter(projectsIntro, projectsIntroBodySchema));
projectsRouter.get("/order", readOrder);
projectsRouter.put(
  "/order",
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(projectsOrderBodySchema),
  putOrder,
);

projectsRouter.get("/:id", validateParams(projectParamsSchema), readProject);
projectsRouter.put(
  "/:id",
  validateParams(projectParamsSchema),
  requireContentType("application/json"),
  requireIfMatchOrCreateOnly,
  validateBody(projectBodySchema),
  putProject,
);
projectsRouter.delete("/:id", validateParams(projectParamsSchema), requireIfMatch, removeProject);
