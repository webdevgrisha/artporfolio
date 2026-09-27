import { getApps, initializeApp } from "firebase-admin/app";
import { type DecodedIdToken, getAuth } from "firebase-admin/auth";

import type { AuthUser } from "#services/auth/types";

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
