import { Router } from "express";

import { login, logout, me } from "#modules/auth/controller";
import { requireAuth } from "#modules/auth/middleware";
import { loginBodySchema } from "#modules/auth/schema";
import { issueCsrfToken, requireCsrfToken } from "#shared/middleware/csrf";
import { validateBody } from "#shared/middleware/validation";

export const authRouter = Router();

authRouter.get("/csrf", issueCsrfToken);
authRouter.post("/login", requireCsrfToken, validateBody(loginBodySchema), login);
authRouter.get("/me", requireAuth, me);
authRouter.post("/logout", requireCsrfToken, logout);
