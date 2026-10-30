import { Router } from "express";

import { login, logout, me } from "#modules/auth/controller";
import { requireAuth } from "#modules/auth/middleware";
import { loginBodySchema } from "#modules/auth/schema";
import { requireContentType } from "#shared/middleware/content-type";
import { issueCsrfToken, requireCsrfToken } from "#shared/middleware/csrf";
import { validateBody } from "#shared/middleware/validation";

export const authRouter = Router();

// Every answer here belongs to one session at one moment: the signed-in admin, a CSRF token, the
// result of a login or logout. No cache may keep it, not even an error.
authRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
});

authRouter.get("/csrf", issueCsrfToken);
// No CSRF token: there is no session yet. A forged login could only sign the browser in to the
// account of the ID token, and only the admin may sign in. Requiring JSON also keeps out the
// cross-site forms, which cannot send it.
authRouter.post(
  "/login",
  requireContentType("application/json"),
  validateBody(loginBodySchema),
  login,
);
authRouter.get("/me", requireAuth, me);
authRouter.post("/logout", requireCsrfToken, logout);
