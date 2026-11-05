import type { AuthUser } from "#modules/auth/schema";

declare global {
  namespace Express {
    interface Locals {
      /** Set by the requireAuth middleware, and by identifyReader for the admin. */
      auth?: AuthUser;
    }
  }
}
