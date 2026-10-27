import type { DecodedIdToken } from "firebase-admin/auth";

import { getEnv } from "#config/env";
import { UnauthorizedError } from "#errors/httpError";
import { firebaseAuth, isClientAuthError } from "#services/firebaseAuth";

export interface AuthUser {
  email: string | null;
  uid: string;
}

export interface CreatedSession {
  sessionCookie: string;
  user: AuthUser;
}

// A session cookie may only be created right after the password was entered.
const recentSignInMaxAgeMilliseconds = 5 * 60 * 1_000;

function toAuthUser(claims: DecodedIdToken): AuthUser {
  return {
    email: claims.email ?? null,
    uid: claims.uid,
  };
}

function isAllowedAdmin(claims: DecodedIdToken): boolean {
  return claims.uid === getEnv().adminUid;
}

/**
 * Maps a failed token check to 401 without revealing why it failed. Infrastructure failures are
 * returned unchanged, so the error handler logs them and responds with 500.
 */
function toAuthFailure(error: unknown): unknown {
  return error instanceof UnauthorizedError || isClientAuthError(error)
    ? new UnauthorizedError()
    : error;
}

export async function createSession(idToken: string): Promise<CreatedSession> {
  try {
    const claims = await firebaseAuth().verifyIdToken(idToken, true);
    const authAge = Date.now() - claims.auth_time * 1_000;

    if (!isAllowedAdmin(claims) || authAge < 0 || authAge > recentSignInMaxAgeMilliseconds) {
      throw new UnauthorizedError();
    }

    const sessionCookie = await firebaseAuth().createSessionCookie(idToken, {
      expiresIn: getEnv().sessionTtlMilliseconds,
    });

    return { sessionCookie, user: toAuthUser(claims) };
  } catch (error) {
    throw toAuthFailure(error);
  }
}

export async function verifySession(sessionCookie: string | undefined): Promise<AuthUser> {
  if (!sessionCookie) {
    throw new UnauthorizedError();
  }

  try {
    const claims = await firebaseAuth().verifySessionCookie(sessionCookie, true);

    if (!isAllowedAdmin(claims)) {
      throw new UnauthorizedError();
    }

    return toAuthUser(claims);
  } catch (error) {
    throw toAuthFailure(error);
  }
}

export async function revokeSession(sessionCookie: string | undefined): Promise<void> {
  if (!sessionCookie) {
    return;
  }

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

  if (isAllowedAdmin(claims)) {
    await firebaseAuth().revokeRefreshTokens(claims.uid);
  }
}
