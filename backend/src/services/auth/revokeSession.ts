import type { DecodedIdToken } from "firebase-admin/auth";

import { getEnv } from "#config/env";
import { firebaseAuth, isAllowedAdmin, isClientAuthError } from "#services/auth/firebaseAuth";

export async function revokeSession(sessionCookie: string | undefined): Promise<void> {
  if (!sessionCookie) {
    return;
  }

  const config = getEnv();
  let claims: DecodedIdToken;

  try {
    claims = await firebaseAuth().verifySessionCookie(sessionCookie);
  } catch (error) {
    // Logout remains successful when the cookie is already invalid or expired.
    if (isClientAuthError(error)) {
      return;
    }

    throw error;
  }

  if (isAllowedAdmin(claims, config.adminUid)) {
    await firebaseAuth().revokeRefreshTokens(claims.uid);
  }
}
