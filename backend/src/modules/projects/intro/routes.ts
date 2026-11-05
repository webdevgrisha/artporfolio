import { Router } from "express";

import { readIntro, replaceIntro } from "#modules/projects/intro/controller";
import { projectsIntroBodySchema } from "#modules/projects/intro/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { requireIfMatch } from "#shared/middleware/preconditions";
import { validateBody } from "#shared/middleware/validation";

export const projectsIntroRouter = Router();

// The text is public: the site shows it above the projects. A change replaces it, and only the
// text the client read: it sends its ETag in If-Match.
projectsIntroRouter.get("/", readIntro);
projectsIntroRouter.put(
  "/",
  requireContentType("application/json"),
  requireIfMatch,
  validateBody(projectsIntroBodySchema),
  replaceIntro,
);
