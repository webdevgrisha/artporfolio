import { Router } from "express";

import { login, logout, me } from "#controllers/auth";
import { requireAuth } from "#middleware/auth";
import { loginBodySchema } from "#schemas/auth";
import { issueCsrfToken, requireCsrfToken } from "#shared/middleware/csrf";
import { validateBody } from "#shared/middleware/validation";

export const authRouter = Router();

authRouter.get("/csrf", issueCsrfToken);
authRouter.post("/login", requireCsrfToken, validateBody(loginBodySchema), login);
authRouter.get("/me", requireAuth, me);
authRouter.post("/logout", requireCsrfToken, logout);
