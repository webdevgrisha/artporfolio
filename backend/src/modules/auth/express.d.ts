import type { AuthUser } from "#modules/auth/schema";

declare global {
  namespace Express {
    interface Locals {
      /** Set by the requireAuth middleware. */
      auth?: AuthUser;
    }
  }
}
