import { Router } from "express";

import {
  putOrder,
  putProject,
  readOrder,
  readProject,
  readProjects,
  removeProject,
} from "#modules/projects/controller";
import { readProjectsIntro } from "#modules/projects/intro/controller";
import { projectsIntro } from "#modules/projects/intro/resource";
import { projectsIntroBodySchema } from "#modules/projects/intro/schema";
import {
  projectBodySchema,
  projectParamsSchema,
  projectsOrderBodySchema,
} from "#modules/projects/schema";
import { documentResourceRouter } from "#shared/http/document-resource-router";
import { languageQuerySchema } from "#shared/i18n/language-query";
import { requireContentType } from "#shared/middleware/content-type";
import { requireIfMatch, requireIfMatchOrCreateOnly } from "#shared/middleware/preconditions";
import { validateBody, validateParams, validateQuery } from "#shared/middleware/validation";

export const projectsRouter = Router();

// Projects are public: the site shows them to every visitor, with the texts in the language of its
// page (`?lang=`); the admin reads them in the source language. A change applies only to the
// project, or the order, the client read: it sends its ETag in If-Match. The client names a new
// project itself and creates it with PUT and If-None-Match: *, so repeating the request is safe.
projectsRouter.get("/", validateQuery(languageQuerySchema), readProjects);

// Registered before "/:id", which takes only UUIDs anyway. The text is read in a language, so its
// own read comes before the shared router, whose read would ignore `?lang=`.
projectsRouter.get("/intro", validateQuery(languageQuerySchema), readProjectsIntro);
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
