import { Router } from "express";

import { login, logout, me } from "#controllers/auth/index";
import { requireAuth } from "#middleware/auth/index";
import { issueCsrfToken, requireCsrfToken } from "#middleware/csrf/index";
import { validateBody } from "#middleware/validation/index";
import { loginBodySchema } from "#schemas/auth/index";

export const authRouter = Router();

authRouter.get("/csrf", issueCsrfToken);
authRouter.post("/login", requireCsrfToken, validateBody(loginBodySchema), login);
authRouter.get("/me", requireAuth, me);
authRouter.post("/logout", requireCsrfToken, logout);
