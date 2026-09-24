import { getAuthConfig, recentSignInMaxAgeMilliseconds } from "#config/authConfig";
import { UnauthorizedError } from "#errors/httpError";
import { firebaseAuth, isAllowedAdmin, toAuthUser } from "#services/auth/firebaseAuth";
import type { CreatedSession } from "#services/auth/types";

export async function createSession(idToken: string): Promise<CreatedSession> {
  const config = getAuthConfig();

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
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    throw new UnauthorizedError();
  }
}
