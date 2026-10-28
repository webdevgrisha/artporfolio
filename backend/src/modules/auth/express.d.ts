import type { AuthUser } from "#modules/auth/service";

declare global {
  namespace Express {
    interface Locals {
      /** Set by the requireAuth middleware. */
      auth?: AuthUser;
    }
  }
}
