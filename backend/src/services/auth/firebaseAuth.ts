import { getApps, initializeApp } from "firebase-admin/app";
import { type DecodedIdToken, getAuth } from "firebase-admin/auth";

import { UnauthorizedError } from "#errors/httpError";
import type { AuthUser } from "#services/auth/types";

// These Admin SDK codes describe a broken backend setup, not a bad client token.
const infrastructureAuthErrorCodes = new Set([
  "auth/insufficient-permission",
  "auth/internal-error",
  "auth/invalid-credential",
  "auth/project-not-found",
]);

export function firebaseAuth() {
  const app = getApps()[0] ?? initializeApp();
  return getAuth(app);
}

export function toAuthUser(claims: DecodedIdToken): AuthUser {
  return {
    email: claims.email ?? null,
    uid: claims.uid,
  };
}

export function isAllowedAdmin(claims: DecodedIdToken, adminUid: string): boolean {
  return claims.uid === adminUid;
}

/**
 * Maps a failed token check to 401 without revealing why it failed. Infrastructure failures are
 * returned unchanged, so the error handler logs them and responds with 500.
 */
export function toAuthFailure(error: unknown): unknown {
  return error instanceof UnauthorizedError || isClientAuthError(error)
    ? new UnauthorizedError()
    : error;
}

export function isClientAuthError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const { code } = error;

  return (
    typeof code === "string" && code.startsWith("auth/") && !infrastructureAuthErrorCodes.has(code)
  );
}
