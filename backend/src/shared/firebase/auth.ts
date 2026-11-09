import { getAuth } from "firebase-admin/auth";

import { firebaseApp } from "#shared/firebase/app";

// The Admin SDK codes of a bad client token or cookie: malformed, expired, revoked, or of a user
// who is gone. Any other code, including one a new SDK adds, is a fault of the backend.
const clientAuthErrorCodes = new Set([
  "auth/argument-error",
  "auth/id-token-expired",
  "auth/id-token-revoked",
  "auth/invalid-id-token",
  "auth/session-cookie-expired",
  "auth/session-cookie-revoked",
  "auth/user-disabled",
  "auth/user-not-found",
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

  return typeof code === "string" && clientAuthErrorCodes.has(code);
}
