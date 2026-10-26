import type { AuthUser } from "#services/auth/types";

declare global {
  namespace Express {
    interface Locals {
      /** Set by the requireAuth middleware. */
      auth?: AuthUser;
    }
  }
}
