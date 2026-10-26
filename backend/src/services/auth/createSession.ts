import { getEnv } from "#config/env";
import { UnauthorizedError } from "#errors/httpError";
import {
  firebaseAuth,
  isAllowedAdmin,
  isClientAuthError,
  toAuthUser,
} from "#services/auth/firebaseAuth";
import type { CreatedSession } from "#services/auth/types";

// A session cookie may only be created right after the password was entered.
const recentSignInMaxAgeMilliseconds = 5 * 60 * 1_000;

export async function createSession(idToken: string): Promise<CreatedSession> {
  const config = getEnv();

  try {
    const claims = await firebaseAuth().verifyIdToken(idToken, true);
    const authAge = Date.now() - claims.auth_time * 1_000;

    if (
      !isAllowedAdmin(claims, config.adminUid) ||
      authAge < 0 ||
      authAge > recentSignInMaxAgeMilliseconds
    ) {
      throw new UnauthorizedError();
    }

    const sessionCookie = await firebaseAuth().createSessionCookie(idToken, {
      expiresIn: config.sessionTtlMilliseconds,
    });

    return { sessionCookie, user: toAuthUser(claims) };
  } catch (error) {
    if (error instanceof UnauthorizedError || isClientAuthError(error)) {
      throw new UnauthorizedError();
    }

    throw error;
  }
}
