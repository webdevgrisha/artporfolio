import { getAuth } from "firebase-admin/auth";

import { firebaseApp } from "#services/firebaseApp";

// These Admin SDK codes describe a broken backend setup, not a bad client token.
const infrastructureAuthErrorCodes = new Set([
  "auth/insufficient-permission",
  "auth/internal-error",
  "auth/invalid-credential",
  "auth/project-not-found",
]);

export function firebaseAuth() {
  return getAuth(firebaseApp());
}

/** True for token problems caused by the client: invalid, expired or revoked credentials. */
export function isClientAuthError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  const { code } = error;

  return (
    typeof code === "string" && code.startsWith("auth/") && !infrastructureAuthErrorCodes.has(code)
  );
}
